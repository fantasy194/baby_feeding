<template>
  <div :class="gridClass">
    <GlassSurface v-for="card in cards" :key="card.label" class="glass-card shadow-none p-3 flex flex-col gap-1">
      <div class="text-xs opacity-80">{{ card.label }}</div>
      <div class="text-xl font-semibold flex items-center gap-2">
        <span class="emoji">{{ card.icon }}</span> {{ card.text }}
      </div>
    </GlassSurface>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed } from 'vue';
import GlassSurface from './GlassSurface.vue';
const props = defineProps<{ status: any; mobile?: boolean; variant?: 'row' | 'column' }>();
const fmt = (ts?: number) => ts ? dayjs(ts).format('HH:mm') : '无记录';
const feedText = computed(() => {
  const f = props.status?.lastFeed;
  return f ? `${fmt(f.timestamp)} · ${f.amount}ml (${f.subtype === 'formula' ? '奶粉' : '母乳' })` : '无记录';
});
const peeText = computed(() => fmt(props.status?.lastPee?.timestamp));
const poopText = computed(() => fmt(props.status?.lastPoop?.timestamp));
const vitaminText = computed(() => fmt(props.status?.lastVitamin?.timestamp));
const cards = computed(() => ([
  { label: '上次喂奶', icon: '🍼', text: feedText.value },
  { label: '上次大便', icon: '💩', text: poopText.value },
  { label: '上次尿尿', icon: '💧', text: peeText.value },
  { label: '维生素AD', icon: '🅰️', text: vitaminText.value },
]));
const gridClass = computed(() => {
  if (props.variant === 'row') return 'grid grid-cols-4 gap-3';
  return props.mobile ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 gap-3';
});
</script>

<style scoped>
.emoji { @apply text-xl; }
</style>
