<template>
  <div>
    <CustomCard
      title="菜单选择器单选、禁用某项、过滤、选择完选项值自动关闭弹窗"
    >
      <u-tree-select
        v-model="treeSelect"
        style="width: 240px"
        :data="data"
        label-key="name"
        value-key="id"
        expand-all
        :disabledNode="disabledNode"
        filterable
        closeOnSelect
        @change="handleChange"
      ></u-tree-select>

      <u-card-action>
        <u-button @click="handleChangeSelect">改值</u-button>
      </u-card-action>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'

const treeSelect = shallowRef(1)

const disabledNode = data => {
  return data.id % 4 === 0
}

const data = shallowRef<any[]>([
  { name: '烤冷面', id: 1 },
  {
    name: '手抓饼',
    id: 2,
    children: [
      {
        name: '鱼香肉丝',
        id: 3,
        children: [
          {
            name: '烤苞米',
            id: 4,
            children: [
              { name: '苞米例', id: 5 },
              { name: '吃', id: 6 },
              { name: 'h', id: 7 }
            ]
          }
        ]
      },
      {
        name: 'fggg',
        id: 8,
        children: [
          { name: '苞米例2', id: 9 },
          { name: '吃2', id: 10 },
          { name: 'h2', id: 11 }
        ]
      }
    ]
  },
  { name: '烤冷面12', id: 12 },
  { name: '烤冷面13', id: 13 },
  { name: '烤冷面14', id: 14 }
])

const handleChange = (val, selected) => {
  console.log(val, selected)
}

function handleChangeSelect() {
  treeSelect.value = 2
}
</script>
