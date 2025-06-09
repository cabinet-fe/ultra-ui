<template>
  <div ref="container">
    <div>
      <div v-for="item of data"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, useTemplateRef, watch, watchEffect } from 'vue'
import { Virtualizer, VirtualContainer } from './virtualizer'
import { nanoid } from 'cat-kit/fe'

const data = shallowRef<any[]>([])
const totalData = shallowRef<any[]>([])
const height = shallowRef(0)

const x = new Virtualizer({
  estimateSize: () => 36
})
const y = new Virtualizer({
  estimateSize: () => 100,
  length: 10
})

const container = new VirtualContainer({
  x,
  y
})

v.update(({ items, totalSize }) => {
  data.value = items.map(({ index }) => totalData.value[index])
  height.value = totalSize
})

watch(totalData, totalData => {
  v.setOption({
    length: totalData.length
  })
})

const containerRef = useTemplateRef('container')
watchEffect(() => {
  containerRef.value && container.connect(containerRef.value)
})

setTimeout(() => {
  totalData.value = Array.from({ length: 1000 }).map(() => {
    return {
      id: nanoid(10),
      name: '姓名1'
    }
  })
}, 1000)
</script>
