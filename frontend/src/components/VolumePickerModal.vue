<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @keydown.stop="onKey" tabindex="0">
    <div class="bg-slate-800 text-white rounded-2xl p-6 w-[520px] shadow-xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold">选择奶量</h3>
        <button class="text-sm opacity-70" @click="$emit('cancel')">关闭</button>
      </div>
      <div class="flex items-center justify-center gap-4 text-5xl font-bold my-6">
        <button class="px-3 py-2 bg-slate-700 rounded-lg" @click="dec">-</button>
        <div>{{ volume }} ml</div>
        <button class="px-3 py-2 bg-slate-700 rounded-lg" @click="inc">+</button>
      </div>
      <div class="flex justify-center gap-3 mt-4">
        <button class="px-4 py-2 rounded bg-emerald-500 text-black font-semibold" @click="confirm()">确定</button>
        <button class="px-4 py-2 rounded bg-slate-600 text-white" @click="$emit('cancel')">取消</button>
      </div>
      <p class="text-xs opacity-60 mt-4 text-center">键盘 ↑/↓ 调整，Enter 确认</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
const props = defineProps<{ defaultVolume: number; config?: { volumeStep: number; volumeMin: number; volumeMax: number } }>();
const emit = defineEmits<{
  (e: 'confirm', vol: number): void;
  (e: 'cancel'): void;
}>();
const volume = ref(props.defaultVolume);
const step = () => props.config?.volumeStep || 10;
const min = () => props.config?.volumeMin || 30;
const max = () => props.config?.volumeMax || 180;
const inc = () => volume.value = Math.min(max(), volume.value + step());
const dec = () => volume.value = Math.max(min(), volume.value - step());
const confirm = () => emit('confirm', volume.value);
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp') inc();
  if (e.key === 'ArrowDown') dec();
  if (e.key === 'Enter') confirm();
  if (e.key === 'Escape') emit('cancel');
};

onMounted(() => {
  const el = document.activeElement as HTMLElement;
  (el as HTMLElement)?.blur();
});
</script>
