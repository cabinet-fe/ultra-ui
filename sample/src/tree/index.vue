<template>
  <div>
    <u-card>
      全部展开
      <UTree
        style="margin-bottom: 10px"
        :data="data"
        label-key="name"
        value-key="id"
        expand-all
      />
    </u-card>

    <u-card style="margin-bottom: 10px">
      expand-on-click-node是否在点击节点的时候展开或者收缩节点
      <UTree
        :data="data"
        label-key="name"
        value-key="id"
        expand-on-click-node
      ></UTree>
    </u-card>

    <u-card style="margin-bottom: 10px">

      <UTree
        :data="data"

        label-key="name"
        value-key="id"
        @node-click="handleNodeClick"
        select
      />

      select单选 {{ select }}
    </u-card>

    <u-card style="margin-bottom: 10px">
      checkable多选 {{}}
      <UTree :data="data" expand-all label-key="name" value-key="id" checkable>
      </UTree>
    </u-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const data = [
  { name: '烤冷面', id: 1 },
  {
    name: '手抓饼',
    id: 2,
    children: [
      {
        name: '鱼香肉丝',
        id: 3,
        children: [
          { name: '烤苞米', id: 4, children: [{ name: '苞米例', id: 5 }] }
        ]
      }
    ]
  }
]

let select = ref({})

const handleNodeClick = (value: any) => {
  console.log(value, 'values')
  select.value = value
}
</script>

<style lang="scss" scoped></style>
