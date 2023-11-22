<template>
  <div class="list-box">
    <h3>List 列表</h3>
    <div class="list-row">
      <h4>基本列表</h4>
      <u-list :data="list" show-radio @delete="deleteBtn"></u-list>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

const list = reactive([
  {
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    title: 'Smith1',
    desc: '111111111',
    date: '2023-12-12'
  },
  {
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    title: 'Smith2',
    desc: '111111111',
    date: '2023-12-12'
  },
  {
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    title: 'Smith3',
    desc: '111111111',
    date: '2023-12-12'
  }
])

const deleteBtn = (val: any, index: number) => {
  console.log(val, index)
  list.splice(index, 1)
  console.log(list, 'list')
}
</script>

<style lang="scss" scoped>
.list-row {
  border: 1px solid #ced4d9;
  padding: 0 10px;
}
</style>
