<template>
  <div class="wrapper">
    <div class="config">
      <div class="title">config</div>
      <ul>
        <li v-for="item in configList">
          <u-checkbox v-model="config[item.key]">{{ item.label }}：{{ item.key }}</u-checkbox>
        </li>
        <li>
          <div>方位：position</div>
          <u-radio-group
            radioType="btn"
            :data="[
              { label: '上', value: 'top' },
              { label: '下', value: 'bottom' },
              { label: '左', value: 'left' },
              { label: '右', value: 'right' }
            ]"
            v-model="config.position"
          />
        </li>
      </ul>
    </div>
    <div class="display">
      <div class="title">display</div>
      <u-tabs
        :items="items"
        v-model="active"
        :position="config.position"
        :closable="config.closable"
        @click="handleClick"
        @delete="handleDelete"
        @update:items="handleUpdate"
        :sortable="config.sortable"
      >
        <template v-for="item in items" #[item]>{{ item }}</template>
      </u-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

let items = ref(['TabOne', 'TabTwo', 'TabThree', 'TabFour'])
// let items = [
//   { key: '1', name: 'TabOne' },
//   { key: '2', name: 'TabTwo', disabled: true },
//   { key: '3', name: 'TabThree' }
// ]

const active = ref<string>('1')

const handleClick = (item, index) => {
  console.log(item, index)
}

const handleDelete = (item, index) => {
  console.log(item, index)
}

const handleUpdate = (item) => {
  console.log(item)
}

const configList = [
  { label: '可关闭', key: 'closable' },
  { label: '排序', key: 'sortable' }
]
const config = reactive({
  closable: false,
  sortable: false,
  position: 'top' as any
})
</script>

<style lang="scss" scoped>
.wrapper {
  height: 100%;
  display: flex;
  justify-content: space-around;
  .config {
    flex: 1;
    border-right: 1px solid #eee;
  }
  .display {
    flex: 2;
  }
  .title {
    font-size: 20px;
    font-weight: 700;
    text-align: center;
    line-height: 50px;
  }
}
</style>
