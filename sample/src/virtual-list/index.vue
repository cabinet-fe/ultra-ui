<template>
  <div>
    {{ data.length }}条数据
    <u-button @click="addData">加100条数据</u-button>
    <u-button @click="removeData">减100条数据</u-button>
    <u-virtual-list
      class="vl"
      :data="data"
      height="800px"
      tag="ul"
      :buffer-size="0"
      #default="{ item }"
    >
      <list-item :item="item" />
    </u-virtual-list>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import ListItem from './list-item.vue'

const addData = () => {
  const len = data.value.length
  data.value = [
    ...data.value,
    ...Array.from({ length: 100 }).map((_, i) => {
      return {
        name:
          i +
          len +
          '优化方法：预渲染一些项，减少渲染的数据的计算，在非滚动期间进行预渲染，一旦开始滚动则结束预渲染。',
        id: i + data.value.length
      }
    })
  ]
}
const removeData = () => {
  data.value = data.value.slice(0, data.value.length - 100)
}
const data = shallowRef<any[]>([])

addData()
</script>

<style lang="scss" scoped>
.vl {
  border: var(--u-border);
}
</style>
