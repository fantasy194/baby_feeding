<template>
  <div class="w-full h-full flex flex-col justify-center gap-3">
    <div class="text-base font-medium opacity-90">距离下次喂奶</div>
    <div class="font-semibold tracking-tight leading-none countdown-text" :class="{ 'text-red-300': isOverdue }">{{ display }}</div>
    <div class="text-sm opacity-90 flex items-center gap-2">
      <span class="emoji">⌚</span> 上次：{{ lastFeedText }}
    </div>
    <div v-if="isOverdue" class="text-sm text-red-200 font-semibold">已超时，请尽快喂奶</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';

const props = defineProps<{ status: any }>();
const now = ref(Date.now());

setInterval(() => now.value = Date.now(), 1000);

const remaining = computed(() => {
  if (!props.status) return 0;
  return props.status.nextFeedDue - now.value;
});
const isOverdue = computed(() => remaining.value <= 0);
const display = computed(() => {
  const ms = Math.max(0, remaining.value);
  const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
  const m = Math.floor(ms / 60000 % 60).toString().padStart(2, '0');
  const s = Math.floor(ms / 1000 % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
});

const lastFeedText = computed(() => {
  const f = props.status?.lastFeed;
  if (!f) return '无记录';
  return `${dayjs(f.timestamp).format('HH:mm')} · ${f.amount}ml`;
});
</script>

<style scoped>
.countdown-text {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: clamp(72px, 14vw, 140px);
}
</style>
