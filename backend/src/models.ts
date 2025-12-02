export type EventType = 'feed' | 'pee' | 'poop' | 'vitamin';

export interface Baby {
  id: string; // platform baby id
  alias: string; // human readable
}

export interface FeedConfig {
  intervalMinutes: number; // alert threshold
  volumeStep: number;
  volumeMin: number;
  volumeMax: number;
}

export interface AppSettings {
  theme: 'auto' | 'light' | 'dark';
  timezone: string;
  layoutPreference?: 'auto' | 'bar' | 'mobile';
  feedConfig: FeedConfig;
}

export interface BabyEventBase {
  eventId: string;
  babyId: string;
  userId: string;
  timestamp: number; // epoch ms
  createdAt: number;
  deleted?: boolean;
  type: EventType;
}

export interface FeedEvent extends BabyEventBase {
  type: 'feed';
  amount: number; // ml
  subtype: 'formula' | 'breast_bottle';
  memo?: string;
}

export interface SimpleEvent extends BabyEventBase {
  type: 'pee' | 'poop' | 'vitamin';
}

export interface VitaminEvent extends BabyEventBase {
  type: 'vitamin';
}

export type BabyEvent = FeedEvent | SimpleEvent | VitaminEvent;

export interface SyncState {
  serverMinorVersion: number;
  lastLocalMinorVersion: number;
  lastFeed?: FeedEvent;
  lastPee?: SimpleEvent;
  lastPoop?: SimpleEvent;
  lastVitamin?: SimpleEvent;
}

export interface PiyoLogCredentials {
  clientToken: string;
  userId: string;
  babyId: string;
  app?: string;
  clientId?: number;
}

export interface FrontendStatus {
  baby: Baby;
  lastFeed?: FeedEvent;
  lastPee?: SimpleEvent;
  lastPoop?: SimpleEvent;
  lastVitamin?: SimpleEvent;
  nextFeedDue: number; // epoch ms when alert fires
  settings: AppSettings;
}

export interface WsMessage<T = unknown> {
  type: 'status' | 'events' | 'settings';
  payload: T;
}
