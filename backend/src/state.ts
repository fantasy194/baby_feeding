import { AppSettings, Baby } from './models.js';
import { DEFAULT_SETTINGS, PIYOLOG_CREDENTIALS } from './env.js';

let settings: AppSettings = DEFAULT_SETTINGS;
let baby: Baby = { id: PIYOLOG_CREDENTIALS.babyId || 'baby-1', alias: 'niuniu' };

export function getSettings() {
  return settings;
}

export function updateSettings(partial: Partial<AppSettings>) {
  settings = { ...settings, ...partial, feedConfig: { ...settings.feedConfig, ...partial.feedConfig } };
  return settings;
}

export function getBaby() {
  return baby;
}

export function setBaby(newBaby: Baby) {
  baby = newBaby;
}
