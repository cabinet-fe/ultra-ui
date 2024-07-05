<template>
  <div>
    <CustomCard title="菜单选择器多选、禁用某项、过滤">
      多选{{ treeCheckable }}
      <u-multi-tree-select
        v-model="treeCheckable"
        :data="data"
        label-key="name"
        value-key="id"
        children-key="children"
        checkable
        expand-all
        :disabledNode="disabledNode"
        filterable
        @change="handleChange"
      ></u-multi-tree-select>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from "vue"
import CustomCard from "../card/custom-card.vue"

const treeCheckable = shallowRef([8, 9, 11])

const disabledNode = (data) => {
  return data.id % 4 === 0
}
const data = shallowRef<any[]>([])

setTimeout(() => {
  data.value = [
    { name: "烤冷面", id: 1 },
    {
      name: "手抓饼",
      id: 2,
      children: [
        {
          name: "鱼香肉丝",
          id: 3,
          children: [
            {
              name: "烤苞米",
              id: 4,
              children: [
                { name: "苞米例", id: 5 },
                { name: "吃", id: 6 },
                { name: "h", id: 7 },
              ],
            },
          ],
        },
        {
          name: "fggg",
          id: 8,
          children: [
            { name: "苞米例2", id: 9 },
            { name: "吃2", id: 10 },
            { name: "h2", id: 11 },
          ],
        },
      ],
    },
  ]
}, 2000)

const handleChange = (value, checked) => {
  console.log(value, checked)
}
</script>
