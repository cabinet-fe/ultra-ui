<template>
  <li style="height: 50px; overflow: hidden" :data-id="item.id">
    {{ item.name }}
  </li>
</template>

<script lang="ts" setup>
defineProps<{
  item: Record<string, any>
}>()
</script>
