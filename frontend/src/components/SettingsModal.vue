<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold">系统设置</h3>
        <button class="text-sm" @click="$emit('close')">关闭</button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-semibold">喂奶间隔 (分钟)</label>
          <input v-model.number="local.feedConfig.intervalMinutes" type="number" class="input" />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="text-sm font-semibold">奶量最小</label>
            <input v-model.number="local.feedConfig.volumeMin" type="number" class="input" />
          </div>
          <div>
            <label class="text-sm font-semibold">奶量最大</label>
            <input v-model.number="local.feedConfig.volumeMax" type="number" class="input" />
          </div>
          <div>
            <label class="text-sm font-semibold">步长</label>
            <input v-model.number="local.feedConfig.volumeStep" type="number" class="input" />
          </div>
        </div>
        <div>
          <label class="text-sm font-semibold">主题</label>
          <select v-model="local.theme" class="input">
            <option value="auto">自动</option>
            <option value="light">白天</option>
            <option value="dark">夜间</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-semibold">时区</label>
          <select v-model="local.timezone" class="input">
            <option value="Asia/Shanghai">Asia/Shanghai</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button class="px-3 py-2 rounded bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white" @click="$emit('close')">取消</button>
        <button class="px-4 py-2 rounded bg-primary text-black dark:text-slate-900 font-semibold" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const props = defineProps<{ settings?: any }>();
const emit = defineEmits(['close', 'save']);
const local = reactive(JSON.parse(JSON.stringify(props.settings || {
  theme: 'auto',
  feedConfig: { intervalMinutes: 270, volumeStep: 10, volumeMin: 30, volumeMax: 180 }
})));
const save = () => emit('save', local as any);
</script>

<style scoped>
.input { @apply w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 mt-1 bg-white dark:bg-slate-800; }
</style>
