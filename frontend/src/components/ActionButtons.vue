<template>
  <div :class="mobile ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-3'">
    <button class="btn" @click="$emit('action', { type: 'feed', subtype: 'formula' })">奶粉</button>
    <button class="btn" @click="$emit('action', { type: 'feed', subtype: 'breast_bottle' })">瓶喂母乳</button>
    <button class="btn soft" @click="$emit('action', { type: 'pee' })">尿尿</button>
    <button class="btn soft" @click="$emit('action', { type: 'poop' })">拉屎</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ mobile?: boolean }>();
</script>

<style scoped>
.btn {
  @apply bg-primary text-black font-semibold rounded-xl py-3 px-4 text-lg shadow hover:bg-sky-400 active:scale-95 transition;
}
.soft {
  @apply bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white;
}
</style>
