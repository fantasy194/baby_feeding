<template>
  <div class="flex items-center gap-2">
    <label class="text-xs opacity-70">Debug</label>
    <input type="checkbox" v-model="localDebug" @change="$emit('toggle-debug')" />
    <div v-if="debug" class="flex gap-1 text-xs">
      <button :class="btn('bar')" @click="$emit('set-mode', 'bar')">条形屏</button>
      <button :class="btn('mobile')" @click="$emit('set-mode', 'mobile')">手机</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
const props = defineProps<{ mode: 'bar' | 'mobile'; debug: boolean }>();
const localDebug = ref(props.debug);
watch(() => props.debug, v => localDebug.value = v);
const btn = (m: 'bar' | 'mobile') => computed(() => `px-2 py-1 rounded ${props.mode === m ? 'bg-slate-700' : 'bg-slate-600/60'}`).value;
</script>
