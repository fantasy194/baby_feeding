<template>
  <div class="glass-card" :style="styleObject">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ padding?: string }>();
const styleObject = props.padding ? { padding: props.padding } : {};
</script>
