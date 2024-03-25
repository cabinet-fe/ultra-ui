<template>
 <u-table :data="data" :columns="columns">
   <template #column:age="{ val }">
    {{ val.toFixed(0) }}岁
  </template>
 </u-table>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const columns = [
  { name: '姓名', key: 'name' },
  { name: '年龄', key: 'age' },
  { name: '地址', key: 'address' }
]

const data = shallowRef(Array.from({ length: 20 }).map((_, index) => {
  return ({
    name: 'name' + index,
    age: Math.random() * 100,
    address: 'address' + index
  })
}))
</script>

<style lang="scss" scoped>

</style>