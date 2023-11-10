<template>
  <u-virtual-list
    class="bar"
    :data="data"
    height="100%"
    tag="ul"
    #default="{ item }"
  >
    <list-item :item="item" />
  </u-virtual-list>
</template>

<script lang="ts" setup>
import ListItem from './list-item.vue'
const data = Array.from({ length: 1000 }).map((_, i) => {
  return {
    name: 'name' + i,
    id: i
  }
})
</script>

<style lang="scss" scoped></style>
