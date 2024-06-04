<template>
  <u-auto-complete :suggestions="suggestions"></u-auto-complete>
</template>

<script setup lang="ts">
const suggestions = Array.from({ length: 100 }, (v, i) => `${i + 1}`)
</script>
