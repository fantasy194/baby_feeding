import axios from 'axios';
import logger from './logger.js';
import { PIYOLOG_BASE, PIYOLOG_CREDENTIALS, DEV_HTTP_DEBUG, PIYOLOG_API_VERSION, PIYOLOG_BOOTSTRAP_MINOR } from './env.js';
import { BabyEvent, FeedEvent, PiyoLogCredentials } from './models.js';
import { getSettings } from './state.js';
import { getServerMinorVersion } from './scheduler.js';
import crypto from 'crypto';

export interface SyncResult {
  serverMinorVersion: number;
  events: BabyEvent[];
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

function mapPiyologEvent(ev: any): BabyEvent | null {
  const ts = ev.datetime2 || (ev.datetime ? Date.parse(ev.datetime.replace(' ', 'T') + 'Z') : Date.now());
  const base = {
    eventId: ev.event_id,
    babyId: ev.baby_id,
    userId: ev.user_id,
    timestamp: ts,
    createdAt: ev.created_at || ts,
    deleted: !!ev.deleted,
  };

  // Heuristic mapping based on real payloads:
  // - amount > 0 => feed (type 2 or 3). type 3 or meta.subtype -> breast, otherwise formula.
  // - pee appears as type 7 in docs, but some users see pee as type 6; use amount==0 && type 7 as pee.
  // - poop: type 6 (amount 0) or type 2 with amount 0.
  // - vitamin AD: type 25 (amount usually 0)
  if (ev.amount > 0 && (ev.type === 2 || ev.type === 3)) {
    const feed: FeedEvent = {
      ...base,
      type: 'feed',
      amount: ev.amount,
      subtype: ev.type === 3 ? 'breast_bottle' : 'formula',
      memo: ev.memo
    };
    return feed;
  }

  if (ev.type === 25) {
    return { ...base, type: 'vitamin' } as BabyEvent;
  }

  // from observed data: type 6 at 12:50 should be 尿尿, type 7 at 10:10 should be 拉屎 => swap
  if (ev.type === 6 && ev.amount === 0) {
    return { ...base, type: 'pee' } as BabyEvent;
  }

  if (ev.type === 7 && ev.amount === 0) {
    return { ...base, type: 'poop' } as BabyEvent;
  }

  // some edge records with amount 0 and type 2 may be poop-like; fallback classify as poop
  if (ev.type === 2 && ev.amount === 0) {
    return { ...base, type: 'poop' } as BabyEvent;
  }

  return null;
}

export async function syncFromPiyoLog(minorVersion: number, creds: PiyoLogCredentials = PIYOLOG_CREDENTIALS): Promise<SyncResult> {
  const effectiveMinor = minorVersion > 0 ? minorVersion : PIYOLOG_BOOTSTRAP_MINOR;
  if (!creds.clientToken || process.env.MOCK_PIYOLOG === 'true') {
    const now = Date.now();
    return {
      serverMinorVersion: minorVersion + 1,
      events: [
        {
          eventId: 'mock-feed',
          babyId: creds.babyId || 'baby-1',
          userId: creds.userId || 'user-1',
          timestamp: now - 2 * 60 * 60 * 1000,
          createdAt: now - 2 * 60 * 60 * 1000,
          type: 'feed',
          amount: 120,
          subtype: 'formula'
        }
      ]
    };
  }

  const body = {
    minor_version: effectiveMinor,
    api_version: PIYOLOG_API_VERSION,
    client_id: creds.clientId || 1,
    client_token: creds.clientToken,
    user_id: creds.userId,
    main_version: 1,
    app: creds.app || 'PiyoLog for iPhone'
  };

  try {
    const res = await axios.post(PIYOLOG_BASE, body, { headers: DEFAULT_HEADERS });
    if (DEV_HTTP_DEBUG) {
      logger.info({ req: { url: PIYOLOG_BASE, body }, resStatus: res.status, resData: res.data }, 'PiyoLog sync http');
    }
    const serverMinor = res.data?.minor_version ?? effectiveMinor;
    const eventsRaw = res.data?.data?.baby_event ?? [];
    const events = eventsRaw.map(mapPiyologEvent).filter(Boolean) as BabyEvent[];
    logger.info({ count: events.length, minorVersion: effectiveMinor, serverMinor }, 'PiyoLog sync');
    return { serverMinorVersion: serverMinor, events };
  } catch (err: any) {
    if (err.response?.data?.message === 'version error' && effectiveMinor !== PIYOLOG_BOOTSTRAP_MINOR) {
      logger.warn({ effectiveMinor }, 'version error, retry with bootstrap minor');
      return syncFromPiyoLog(PIYOLOG_BOOTSTRAP_MINOR, creds); // retry once with bootstrap
    }
    if (DEV_HTTP_DEBUG) {
      logger.error({ err: err.response?.data || err.message }, 'PiyoLog sync http error');
    }
    throw err;
  }
}

export async function submitEvent(event: BabyEvent, creds: PiyoLogCredentials = PIYOLOG_CREDENTIALS): Promise<void> {
  if (!creds.clientToken || process.env.MOCK_PIYOLOG === 'true') {
    logger.warn({ event }, 'MOCK submit event');
    return;
  }

  const settings = getSettings();
  const tz = settings.timezone || 'Asia/Shanghai';
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });

  const dateStr = dateFormatter.format(new Date(event.timestamp)).replace(/-/g, '');
  const timeStr = timeFormatter.format(new Date(event.timestamp));
  const datetimeStr = `${dateStr} ${timeStr}`;

  const eventId = crypto.randomUUID().replace(/-/g, '');
  const outerMinor = getServerMinorVersion() || 0;

  let payloadType: number;
  switch (event.type) {
    case 'feed': {
      const feed = event as FeedEvent;
      payloadType = feed.subtype === 'breast_bottle' ? 3 : 2;
      break;
    }
    case 'pee':
      payloadType = 6; // 尿尿
      break;
    case 'poop':
      payloadType = 7; // 拉屎
      break;
    case 'vitamin':
      payloadType = 25; // 维生素AD
      break;
    default:
      payloadType = 25;
      break;
  }

  const payloadEvent: any = {
    minor_version: 0,
    baby_id: creds.babyId,
    amount: event.type === 'feed' ? (event as FeedEvent).amount : 0,
    user_id: creds.userId,
    date: Number(dateStr),
    main_version: 0,
    datetime: datetimeStr,
    right_time: 0,
    modified_at: event.createdAt,
    type: payloadType,
    event_id: eventId,
    created_at: event.createdAt,
    left_time: 0,
    image_url: '',
    time: timeStr,
    memo: event.type === 'feed' ? (event as FeedEvent).memo || '' : '',
    deleted: false,
    meta: event.type === 'feed' ? '' : '',
    value: event.type === 'feed' ? (event as FeedEvent).amount : 0,
    datetime2: event.timestamp
  };

  const body = {
    app: creds.app || 'PiyoLog for iPhone',
    minor_version: outerMinor,
    api_version: PIYOLOG_API_VERSION,
    client_token: creds.clientToken,
    main_version: 1,
    data: { baby_event: [payloadEvent] },
    user_id: creds.userId,
    client_id: creds.clientId || 1
  };

  await axios.post(PIYOLOG_BASE, body, { headers: DEFAULT_HEADERS });
  if (DEV_HTTP_DEBUG) {
    logger.info({ req: { url: PIYOLOG_BASE, body } }, 'PiyoLog submit http');
  }
  logger.info({ eventId, type: event.type }, 'Submitted event to PiyoLog');
}
