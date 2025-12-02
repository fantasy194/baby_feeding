<template>
  <div :class="mobile ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'">
    <div class="bg-white/5 rounded-xl p-3">
      <div class="text-xs opacity-70">最近喂奶</div>
      <div class="text-lg font-semibold">{{ feedText }}</div>
    </div>
    <div class="bg-white/5 rounded-xl p-3">
      <div class="text-xs opacity-70">上次尿尿</div>
      <div class="text-lg font-semibold">{{ peeText }}</div>
    </div>
    <div class="bg-white/5 rounded-xl p-3">
      <div class="text-xs opacity-70">上次拉屎</div>
      <div class="text-lg font-semibold">{{ poopText }}</div>
    </div>
    <div class="bg-white/5 rounded-xl p-3">
      <div class="text-xs opacity-70">环境 (预留)</div>
      <div class="text-lg font-semibold">室内 24℃ / 55% · 室外 API 预留</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed } from 'vue';
const props = defineProps<{ status: any; mobile?: boolean }>();
const fmt = (ts?: number) => ts ? dayjs(ts).format('HH:mm') : '无记录';
const feedText = computed(() => {
  const f = props.status?.lastFeed;
  return f ? `${fmt(f.timestamp)} · ${f.amount}ml (${f.subtype === 'formula' ? '配方' : '母乳瓶' })` : '无记录';
});
const peeText = computed(() => fmt(props.status?.lastPee?.timestamp));
const poopText = computed(() => fmt(props.status?.lastPoop?.timestamp));
</script>
