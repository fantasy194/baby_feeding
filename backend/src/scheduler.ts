import { SYNC_INTERVAL_MS, PIYOLOG_BOOTSTRAP_MINOR } from './env.js';
import logger from './logger.js';
import { BabyEvent, FeedEvent, SyncState } from './models.js';
import { syncFromPiyoLog } from './piyologProvider.js';
import { broadcastStatus } from './websocket.js';
import { getSettings, getBaby } from './state.js';

let syncState: SyncState = {
  serverMinorVersion: 0,
  lastLocalMinorVersion: 0,
};

let feedHistory: FeedEvent[] = [];
let peeHistory: BabyEvent[] = [];
let poopHistory: BabyEvent[] = [];
let lastFeed: FeedEvent | undefined;
let lastPee: BabyEvent | undefined;
let lastPoop: BabyEvent | undefined;

export function getLastFeed() {
  return lastFeed;
}

export function getLastPee() {
  return lastPee;
}

export function getLastPoop() {
  return lastPoop;
}

export function getServerMinorVersion() {
  return syncState.serverMinorVersion;
}

function updateLocal(events: BabyEvent[]) {
  for (const ev of events) {
    if (ev.type === 'feed') {
      if (ev.deleted) {
        feedHistory = removeByEventOrNearest(feedHistory, ev);
      } else {
        feedHistory.push(ev as FeedEvent);
      }
      if (feedHistory.length > 200) feedHistory = feedHistory.slice(-200);
      lastFeed = feedHistory.reduce<FeedEvent | undefined>((acc, cur) => (!acc || cur.timestamp > acc.timestamp ? cur : acc), undefined);
    } else if (ev.type === 'pee') {
      if (ev.deleted) {
        peeHistory = removeByEventOrNearest(peeHistory, ev);
      } else {
        peeHistory.push(ev);
      }
      if (peeHistory.length > 200) peeHistory = peeHistory.slice(-200);
      lastPee = peeHistory.reduce<BabyEvent | undefined>((acc, cur) => (!acc || cur.timestamp > acc.timestamp ? cur : acc), undefined);
    } else if (ev.type === 'poop') {
      if (ev.deleted) {
        poopHistory = removeByEventOrNearest(poopHistory, ev);
      } else {
        poopHistory.push(ev);
      }
      if (poopHistory.length > 200) poopHistory = poopHistory.slice(-200);
      lastPoop = poopHistory.reduce<BabyEvent | undefined>((acc, cur) => (!acc || cur.timestamp > acc.timestamp ? cur : acc), undefined);
    }
  }
}

function removeByEventOrNearest<T extends BabyEvent>(list: T[], ev: BabyEvent): T[] {
  const byId = list.filter((e) => e.eventId === ev.eventId);
  if (byId.length) {
    return list.filter((e) => e.eventId !== ev.eventId);
  }
  // 如果服务器删除事件的 event_id 与本地提交不一致，尽量删除同类型且时间最接近的历史事件
  const sorted = [...list].sort((a, b) => Math.abs(a.timestamp - ev.timestamp) - Math.abs(b.timestamp - ev.timestamp));
  const candidate = sorted.find((e) => e.type === ev.type);
  if (!candidate) return list;
  return list.filter((e) => e !== candidate);
}

async function performSync() {
  try {
    const { events, serverMinorVersion } = await syncFromPiyoLog(syncState.lastLocalMinorVersion);
    syncState.serverMinorVersion = serverMinorVersion;
    if (events.length) {
      updateLocal(events);
      broadcastStatus();
    }
    // advance minor version to latest to avoid replays
    syncState.lastLocalMinorVersion = serverMinorVersion;
  } catch (err) {
    logger.error({ err }, 'sync failed');
  }
}

async function bootstrapHistory() {
  // step backwards in batches until we find feed/pee/poop or reach start
  const window = 10;
  let cursor = syncState.serverMinorVersion || PIYOLOG_BOOTSTRAP_MINOR;

  // first fetch to learn server minor if we don't have it
  if (cursor === PIYOLOG_BOOTSTRAP_MINOR) {
    const first = await syncFromPiyoLog(cursor);
    syncState.serverMinorVersion = first.serverMinorVersion;
    syncState.lastLocalMinorVersion = first.serverMinorVersion;
    updateLocal(first.events);
    cursor = first.serverMinorVersion - window;
  }

  while (cursor > 0 && (!lastFeed || !lastPee || !lastPoop)) {
    const { events } = await syncFromPiyoLog(cursor);
    // ensure we only move cursor backward
    updateLocal(events);
    cursor -= window;
  }
  broadcastStatus();
}

export function startScheduler() {
  logger.info({ interval: SYNC_INTERVAL_MS }, 'starting scheduler');
  bootstrapHistory().catch((err) => logger.error({ err }, 'bootstrap history failed'));
  setInterval(performSync, SYNC_INTERVAL_MS);
}

export function getFrontendStatus() {
  const settings = getSettings();
  const baby = getBaby();
  const intervalMs = settings.feedConfig.intervalMinutes * 60 * 1000;
  const nextFeedDue = lastFeed ? lastFeed.timestamp + intervalMs : Date.now();
  return {
    baby,
    lastFeed,
    lastPee: lastPee as any,
    lastPoop: lastPoop as any,
    nextFeedDue,
    settings,
  };
}

export function ingestLocalEvent(ev: BabyEvent) {
  updateLocal([ev]);
  broadcastStatus();
}
