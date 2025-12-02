<template>
  <div class="col-span-2 bg-white/5 rounded-xl p-4 flex flex-col justify-center border border-white/10">
    <div class="text-sm uppercase opacity-70">下次喂奶倒计时</div>
    <div class="text-6xl font-semibold mt-2 tracking-tight" :class="{ 'text-red-400': isOverdue }">{{ display }}</div>
    <div class="text-xs opacity-70 mt-2">上次喂奶：{{ lastFeedText }}</div>
    <div v-if="isOverdue" class="mt-3 text-red-200 font-semibold">已超时，请尽快喂奶</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
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
