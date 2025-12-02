import dotenv from 'dotenv';

dotenv.config();

export const PORT = Number(process.env.PORT || 3000);
export const HOST = process.env.HOST || '0.0.0.0';

export const PIYOLOG_BASE = 'https://api2.piyolog.com/sync';

export const PIYOLOG_CREDENTIALS = {
  clientToken: process.env.PIYOLOG_CLIENT_TOKEN || '',
  userId: process.env.PIYOLOG_USER_ID || '',
  babyId: process.env.PIYOLOG_BABY_ID || '',
  app: process.env.PIYOLOG_APP || 'PiyoLog for iPhone',
  clientId: Number(process.env.PIYOLOG_CLIENT_ID || 1),
};

export const PIYOLOG_API_VERSION = 2.1000000000000001;
export const PIYOLOG_BOOTSTRAP_MINOR = Number(process.env.PIYOLOG_BOOTSTRAP_MINOR || 99999);
export const DEV_HTTP_DEBUG = process.env.DEV_HTTP_DEBUG === 'true';

export const DEFAULT_SETTINGS = {
  theme: 'auto' as const,
  timezone: process.env.TZ || 'Asia/Shanghai',
  layoutPreference: 'auto' as const,
  feedConfig: {
    intervalMinutes: Number(process.env.FEED_INTERVAL_MINUTES || 270), // 4.5h
    volumeStep: Number(process.env.FEED_VOLUME_STEP || 10),
    volumeMin: Number(process.env.FEED_VOLUME_MIN || 30),
    volumeMax: Number(process.env.FEED_VOLUME_MAX || 180),
  },
};

export const SYNC_INTERVAL_MS = Number(process.env.SYNC_INTERVAL_MS || 30000);
