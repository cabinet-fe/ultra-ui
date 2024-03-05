<template>
  <ul class="list">
    <li class="item" v-for="(position, index) in positions">
      <u-tabs
        :items="items"
        v-model="active[index]"
        :position="position"
        :closable="true"
        @click="handleClick"
        @delete="handleDelete"
        @update:items="handleUpdate"
        :sortable="true"
      >
        <template v-for="item in items" #[item]>{{ item }}</template>
      </u-tabs>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref } from 'vue'

let items = ref(['TabOne', 'TabTwo', 'TabThreeTabThree', 'TabFour'])

const active = ref<string[]>(['TabOne', 'TabOne', 'TabOne', 'TabOne'])

const positions: any[] = ['top', 'bottom', 'left', 'right']

const handleClick = (item, index) => {
  console.log(item, index)
}

const handleDelete = (item, index) => {
  console.log(item, index)
}

const handleUpdate = (item) => {
  console.log(item)
}
</script>

<style lang="scss" scoped>
.list {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  .item {
    width: 500px;
    height: 200px;
    border: 1px solid #eee;
    margin: 20px;
  }
}
</style>
