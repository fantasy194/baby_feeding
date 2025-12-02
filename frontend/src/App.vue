<template>
  <div :class="[themeClass, 'min-h-screen flex flex-col']">
    <div class="p-3 flex justify-between items-center text-sm bg-black/10 dark:bg-white/5 backdrop-blur">
      <div class="flex items-center gap-3">
        <span class="font-semibold">喂奶倒计时</span>
        <LayoutSwitcher :mode="layoutMode" :debug="debugMode" @toggle-debug="toggleDebug" @set-mode="setMode" />
      </div>
      <div class="flex items-center gap-2">
        <select class="theme-select" v-model="localTheme" @change="setTheme(localTheme)">
          <option value="auto">自动</option>
          <option value="light">白天</option>
          <option value="dark">夜间</option>
        </select>
        <button class="px-3 py-1 rounded bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" @click="openSettings = true">设置</button>
        <span class="text-xs opacity-70">{{ status?.baby.alias }}</span>
      </div>
    </div>

    <div v-if="layoutMode === 'bar'" class="flex flex-row layout-bar bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div class="flex-1 grid grid-cols-3 gap-3 p-4">
        <CountdownPanel :status="status" />
        <StatusCards :status="status" />
      </div>
      <div class="w-80 p-4 bg-black/20 dark:bg-white/10 flex flex-col justify-center">
        <ActionButtons @action="handleAction" />
      </div>
    </div>

    <div v-else class="flex-1 bg-slate-900 text-white p-4 space-y-4">
      <StatusCards :status="status" mobile />
      <ActionButtons mobile @action="handleAction" />
    </div>

    <VolumePickerModal
      v-if="showVolumePicker"
      :default-volume="lastVolume"
      :config="status?.settings.feedConfig"
      @cancel="showVolumePicker = false"
      @confirm="confirmFeed"
    />

    <SettingsModal v-if="openSettings" :settings="status?.settings" @close="openSettings = false" @save="saveSettings" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import LayoutSwitcher from './components/LayoutSwitcher.vue';
import CountdownPanel from './components/CountdownPanel.vue';
import ActionButtons from './components/ActionButtons.vue';
import VolumePickerModal from './components/VolumePickerModal.vue';
import StatusCards from './components/StatusCards.vue';
import SettingsModal from './components/SettingsModal.vue';

interface FeedConfig {
  intervalMinutes: number;
  volumeStep: number;
  volumeMin: number;
  volumeMax: number;
}
interface AppSettings { theme: 'auto' | 'light' | 'dark'; timezone: string; feedConfig: FeedConfig }
interface EventBase { eventId: string; babyId: string; userId: string; timestamp: number; createdAt: number; type: 'feed' | 'pee' | 'poop'; }
interface FeedEvent extends EventBase { type: 'feed'; amount: number; subtype: 'formula' | 'breast_bottle'; }
interface StatusPayload {
  baby: { id: string; alias: string };
  lastFeed?: FeedEvent;
  lastPee?: EventBase;
  lastPoop?: EventBase;
  nextFeedDue: number;
  settings: AppSettings;
}

const status = ref<StatusPayload | null>(null);
const layoutMode = ref<'bar' | 'mobile'>('bar');
const debugMode = ref(false);
const showVolumePicker = ref(false);
const openSettings = ref(false);
const lastVolume = ref(120);
const pendingSubtype = ref<'formula' | 'breast_bottle'>('formula');
const localTheme = ref<'auto' | 'light' | 'dark'>('auto');

const themeClass = computed(() => {
  const mode = status.value?.settings.theme || localTheme.value;
  if (mode === 'dark' || (mode === 'auto' && new Date().getHours() >= 19)) return 'dark bg-slate-900 text-white';
  return 'bg-slate-50 text-slate-900';
});

function autoLayout() {
  if (debugMode.value) return;
  const ratio = window.innerWidth / window.innerHeight;
  layoutMode.value = ratio > 3 ? 'bar' : 'mobile';
}

function toggleDebug() {
  debugMode.value = !debugMode.value;
}
function setMode(mode: 'bar' | 'mobile') {
  layoutMode.value = mode;
}

function handleAction(payload: { type: 'feed' | 'pee' | 'poop'; subtype?: 'formula' | 'breast_bottle' }) {
  if (payload.type === 'feed') {
    pendingSubtype.value = payload.subtype || 'formula';
    showVolumePicker.value = true;
    return;
  }
  submitEvent({ type: payload.type, amount: 0 });
}

function confirmFeed(amount: number) {
  lastVolume.value = amount;
  showVolumePicker.value = false;
  submitEvent({ type: 'feed', amount, subtype: pendingSubtype.value });
}

async function submitEvent(payload: { type: 'feed' | 'pee' | 'poop'; amount: number; subtype?: 'formula' | 'breast_bottle' }) {
  if (!status.value) return;
  const now = Date.now();
  const event = {
    eventId: 'local-' + now,
    babyId: status.value.baby.id,
    userId: status.value.baby.id,
    timestamp: now,
    createdAt: now,
    type: payload.type,
    amount: payload.type === 'feed' ? payload.amount : 0,
    subtype: payload.subtype || 'formula',
  } as any;
  await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
}

function connectWs() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.type === 'status') {
      status.value = data.payload;
    }
  };
  ws.onclose = () => setTimeout(connectWs, 2000);
}

async function fetchStatus() {
  const res = await fetch('/api/status');
  status.value = await res.json();
  if (status.value?.lastFeed?.amount) {
    lastVolume.value = status.value.lastFeed.amount;
  }
}

onMounted(() => {
  autoLayout();
  window.addEventListener('resize', autoLayout);
  connectWs();
  fetchStatus();

  window.addEventListener('keydown', (e) => {
    if (e.key === '1') handleAction({ type: 'feed', subtype: 'formula' });
    if (e.key === '2') handleAction({ type: 'feed', subtype: 'breast_bottle' });
    if (e.key === '3') handleAction({ type: 'pee' });
    if (e.key === '4') handleAction({ type: 'poop' });
  });
});

function saveSettings(newSettings: AppSettings) {
  fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) })
    .then(() => fetchStatus());
}

function setTheme(mode: 'auto' | 'light' | 'dark') {
  localTheme.value = mode;
  if (status.value) {
    saveSettings({ ...status.value.settings, theme: mode });
  }
}
</script>
