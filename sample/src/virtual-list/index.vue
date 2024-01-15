<template>
  <u-virtual-list
    class="bar"
    :data="data"
    height="100%"
    tag="ul"
    place-tag="li"
    #default="{ item }"
  >
    <list-item :item="item" />
  </u-virtual-list>
</template>

<script lang="ts" setup>
import ListItem from './list-item.vue'
const data = Array.from({ length: 1000 }).map((_, i) => {
  return {
    name: i + '优化方法：预渲染一些项，减少渲染的数据的计算，在非滚动期间进行预渲染，一旦开始滚动则结束预渲染。',
    id: i
  }
})
</script>

<style lang="scss" scoped></style>
