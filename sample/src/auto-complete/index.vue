<template>
  <div>
    <u-auto-complete :suggestions="suggestions"></u-auto-complete>
  </div>
</template>

<script setup lang="ts">
const suggestions = Array.from({ length: 100 }, (v, i) => `${i + 1}`)
</script>
