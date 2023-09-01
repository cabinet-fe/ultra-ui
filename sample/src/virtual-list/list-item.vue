<template>
  <li style="height: 32px; overflow: hidden">
    {{ item.name }}
    <u-button type="primary" v-for="i of 10">
      {{ item.name }} {{  i }}
    </u-button>
  </li>
</template>

<script lang="ts" setup>
defineProps<{
  item: Record<string, any>
}>()
</script>
