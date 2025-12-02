<template>
  <div ref="container" :style="styleObject" class="relative">
    <div v-if="!loaded" class="absolute inset-0 flex items-center justify-center text-xs text-white/70">loading...</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue';
import lottie, { AnimationItem } from 'lottie-web';

const props = defineProps<{ path?: string; data?: any; loop?: boolean; autoplay?: boolean; width?: string; height?: string }>();
const emit = defineEmits<{ (e: 'complete'): void }>();
const container = ref<HTMLDivElement | null>(null);
const loaded = ref(false);
const styleObject = computed(() => ({ width: props.width || '220px', height: props.height || '220px' }));
let anim: AnimationItem | null = null;

const load = () => {
  loaded.value = false;
  if (!container.value) return;
  if (anim) { anim.destroy(); anim = null; }
  try {
    anim = lottie.loadAnimation({
      container: container.value,
      renderer: 'svg',
      loop: props.loop ?? false,
      autoplay: props.autoplay ?? true,
      path: typeof props.path === 'string' ? props.path : undefined,
      animationData: typeof props.path === 'string' ? undefined : (props.path || props.data),
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet', clearCanvas: true }
    });
    anim.addEventListener('DOMLoaded', () => { loaded.value = true; });
    anim.addEventListener('complete', () => emit('complete'));
  } catch (err) {
    console.error('Lottie load error', err);
  }
};

onMounted(load);
watch(() => props.data, load);
watch(() => props.path, load);
onBeforeUnmount(() => anim?.destroy());

defineExpose({ getDuration: () => anim?.getDuration(true) ?? 0 });
</script>
