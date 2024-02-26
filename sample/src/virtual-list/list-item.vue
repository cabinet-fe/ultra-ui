<template>
  <li style="height: 32px; overflow: hidden">
    {{ item.name }}
  </li>
</template>

<script lang="ts" setup>
defineProps<{
  item: Record<string, any>
}>()
</script>
