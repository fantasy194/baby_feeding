<template>
  <div :class="[themeClass, 'min-h-screen flex flex-col relative overflow-hidden']" :style="{ background: 'var(--bg)' }">
    <div class="p-4 flex justify-between items-center text-sm bg-white/10 dark:bg-white/5 backdrop-blur">
      <div class="flex items-center gap-3">
        <span class="font-semibold">喂奶倒计时</span>
        <LayoutSwitcher :mode="layoutMode" :debug="debugMode" @toggle-debug="toggleDebug" @set-mode="setMode" />
        <div v-if="debugMode" class="flex items-center gap-2">
          <button class="px-2 py-1 text-xs rounded bg-white/20" @click="triggerOverlay('success')">测试成功动画</button>
          <button class="px-2 py-1 text-xs rounded bg-white/20" @click="triggerOverlay('fail')">测试失败动画</button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <select class="theme-select" v-model="localTheme" @change="setTheme(localTheme)">
          <option value="auto">自动</option>
          <option value="light">白天</option>
          <option value="dark">夜间</option>
        </select>
        <button class="px-3 py-1 rounded bg-white/30 text-white" @click="openSettings = true">设置</button>
        <span class="text-xs opacity-80">{{ status?.baby.alias }}</span>
      </div>
    </div>


    <div v-if="layoutMode === 'bar'" class="grid grid-cols-[3fr_2fr] min-h-[400px] px-6 py-5 gap-6 relative">
      <div class="flex flex-col gap-4">
        <div class="w-full h-full">
          <CountdownPanel :status="status" />
        </div>
        <StatusCards :status="status" variant="row" />
      </div>
      <div class="grid grid-rows-1">
        <ActionButtons @action="handleAction" />
      </div>
    </div>

    <div v-else class="flex-1 p-4 space-y-4 relative">
      <CountdownPanel :status="status" />
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

    <transition name="fade">
      <div v-if="overlayState" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overlay-blur">
        <div class="flex flex-col items-center gap-3">
          <LottiePlayer
            ref="successRef"
            v-if="overlayState === 'success'"
            :key="overlayState + reloadKey"
            :data="successAnim"
            :width="overlayWidth"
            :height="overlayHeight"
            autoplay
            @complete="onAnimComplete"
          />
          <LottiePlayer
            ref="failRef"
            v-else
            :key="overlayState + reloadKey"
            :data="failAnim"
            :width="overlayWidth"
            :height="overlayHeight"
            autoplay
            @complete="onAnimComplete"
          />
        </div>
      </div>
    </transition>
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
import LottiePlayer from './components/LottiePlayer.vue';
import successAnim from './animations/success_animation.json';
import failAnim from './animations/fail_animation.json';

interface FeedConfig {
  intervalMinutes: number;
  volumeStep: number;
  volumeMin: number;
  volumeMax: number;
}
interface AppSettings { theme: 'auto' | 'light' | 'dark'; timezone: string; layoutPreference?: 'auto' | 'bar' | 'mobile'; feedConfig: FeedConfig }
interface EventBase { eventId: string; babyId: string; userId: string; timestamp: number; createdAt: number; type: 'feed' | 'pee' | 'poop' | 'vitamin'; }
interface FeedEvent extends EventBase { type: 'feed'; amount: number; subtype: 'formula' | 'breast_bottle'; }
interface SimpleEvent extends EventBase { type: 'pee' | 'poop' | 'vitamin' }
interface StatusPayload {
  baby: { id: string; alias: string };
  lastFeed?: FeedEvent;
  lastPee?: SimpleEvent;
  lastPoop?: SimpleEvent;
  lastVitamin?: SimpleEvent;
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
const overlayState = ref<'success' | 'fail' | null>(null);
const reloadKey = ref(0);
const successRef = ref<any>(null);
const failRef = ref<any>(null);
const overlayWidth = computed(() => layoutMode.value === 'bar' ? '70vh' : '80vw');
const overlayHeight = computed(() => layoutMode.value === 'bar' ? '70vh' : '60vw');

const themeClass = computed(() => {
  const mode = status.value?.settings.theme || localTheme.value;
  if (mode === 'dark' || (mode === 'auto' && new Date().getHours() >= 19)) return 'theme-dark';
  return 'theme-light';
});

function autoLayout() {
  if (debugMode.value) return;
  const pref = status.value?.settings.layoutPreference || 'auto';
  if (pref !== 'auto') {
    layoutMode.value = pref;
    return;
  }
  const ratio = window.innerWidth / window.innerHeight;
  layoutMode.value = ratio > 1 ? 'bar' : 'mobile';
}

function toggleDebug() {
  debugMode.value = !debugMode.value;
}
function setMode(mode: 'bar' | 'mobile') {
  layoutMode.value = mode;
}

function handleAction(payload: { type: 'feed' | 'pee' | 'poop' | 'vitamin'; subtype?: 'formula' | 'breast_bottle' }) {
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

async function submitEvent(payload: { type: 'feed' | 'pee' | 'poop' | 'vitamin'; amount: number; subtype?: 'formula' | 'breast_bottle' }) {
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
    subtype: payload.type === 'feed' ? (payload.subtype || 'formula') : undefined,
  } as any;
  try {
    await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
    overlayState.value = 'success';
  } catch (e) {
    console.error('提交事件失败', e);
    overlayState.value = 'fail';
  }
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
  try {
    const res = await fetch('/api/status');
    status.value = await res.json();
    if (status.value?.lastFeed?.amount) {
      lastVolume.value = status.value.lastFeed.amount;
    }
    localTheme.value = status.value?.settings.theme || 'auto';
  } catch (e) {
    console.error('获取状态失败', e);
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
    if (e.key === '5') handleAction({ type: 'vitamin' });
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

function triggerOverlay(state: 'success' | 'fail') {
  overlayState.value = state;
  reloadKey.value++;
}

const successDuration = () => successRef.value?.getDuration() ?? 1.5;
const failDuration = () => failRef.value?.getDuration() ?? 1.5;

function onAnimComplete() {
  overlayState.value = null;
}
</script>
