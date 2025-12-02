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
let vitaminHistory: BabyEvent[] = [];
let lastFeed: FeedEvent | undefined;
let lastPee: BabyEvent | undefined;
let lastPoop: BabyEvent | undefined;
let lastVitamin: BabyEvent | undefined;

export function getLastFeed() {
  return lastFeed;
}

export function getLastPee() {
  return lastPee;
}

export function getLastPoop() {
  return lastPoop;
}

export function getLastVitamin() {
  return lastVitamin;
}

export function getServerMinorVersion() {
  return syncState.serverMinorVersion;
}

function upsert<T extends BabyEvent>(list: T[], ev: T, limit = 400): T[] {
  const idx = list.findIndex((e) => e.eventId === ev.eventId);
  if (ev.deleted) {
    if (idx >= 0) list.splice(idx, 1);
    return list;
  }
  if (idx >= 0) {
    list[idx] = ev;
  } else {
    list.push(ev);
  }
  if (list.length > limit) list = list.slice(-limit);
  return list;
}

function recomputeLasts() {
  lastFeed = feedHistory.reduce<FeedEvent | undefined>((acc, cur) => (!acc || cur.timestamp > acc.timestamp ? cur : acc), undefined);
  lastPee = peeHistory.reduce<BabyEvent | undefined>((acc, cur) => (!acc || cur.timestamp > acc.timestamp ? cur : acc), undefined);
  lastPoop = poopHistory.reduce<BabyEvent | undefined>((acc, cur) => (!acc || cur.timestamp > acc.timestamp ? cur : acc), undefined);
  lastVitamin = vitaminHistory.reduce<BabyEvent | undefined>((acc, cur) => (!acc || cur.timestamp > acc.timestamp ? cur : acc), undefined);
}

function updateLocal(events: BabyEvent[]) {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  for (const ev of sorted) {
    if (ev.type === 'feed') {
      feedHistory = upsert(feedHistory, ev as FeedEvent);
    } else if (ev.type === 'pee') {
      peeHistory = upsert(peeHistory, ev);
    } else if (ev.type === 'poop') {
      poopHistory = upsert(poopHistory, ev);
    } else if (ev.type === 'vitamin') {
      vitaminHistory = upsert(vitaminHistory, ev);
    }
  }
  recomputeLasts();
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

  while (cursor > 0 && (!lastFeed || !lastPee || !lastPoop || !lastVitamin)) {
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
    lastVitamin: lastVitamin as any,
    nextFeedDue,
    settings,
  };
}

export function ingestLocalEvent(ev: BabyEvent) {
  updateLocal([ev]);
  broadcastStatus();
}
