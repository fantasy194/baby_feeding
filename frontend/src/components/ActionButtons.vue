<template>
  <div :class="gridClass">
    <GlassSurface v-for="btn in buttons" :key="btn.label" class="p-0 h-full glass-card shadow-none" :class="btn.span === 2 ? 'col-span-2' : ''">
      <button class="btn" :class="btn.kind" @click="btn.action">
        <span class="emoji text-3xl">{{ btn.icon }}</span>
        <span class="text-lg font-semibold">{{ btn.label }}</span>
      </button>
    </GlassSurface>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import GlassSurface from './GlassSurface.vue';
const props = defineProps<{ mobile?: boolean }>();
const emit = defineEmits(['action']);
const gridClass = computed(() => props.mobile ? 'grid grid-cols-2 gap-3 w-full h-full' : 'grid grid-cols-2 auto-rows-fr gap-3');
const buttons = [
  { label: '奶粉', icon: '🍼', kind: 'btn-strong', action: () => emit('action', { type: 'feed', subtype: 'formula' }) },
  { label: '母乳', icon: '🥛', kind: 'btn-strong', action: () => emit('action', { type: 'feed', subtype: 'breast_bottle' }) },
  { label: '大便', icon: '💩', kind: 'btn-soft', action: () => emit('action', { type: 'poop' }) },
  { label: '尿尿', icon: '💧', kind: 'btn-soft', action: () => emit('action', { type: 'pee' }) },
  { label: '维生素AD', icon: '🅰️', kind: 'btn-soft', span: 2, action: () => emit('action', { type: 'vitamin' }) },
];
</script>

<style scoped>
.btn {
  @apply w-full h-full flex flex-col items-center justify-center gap-2 rounded-3xl py-6 px-4 transition shadow-none;
}
</style>
