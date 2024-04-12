<template>
  <div>
    <CustomCard title="全部展开">
      <UTree
        style="margin-bottom: 10px"
        :data="data"
        label-key="name"
        value-key="id"
        expand-all
      />
    </CustomCard>

    <CustomCard title="点击节点展开">
      <UTree
        :data="data"
        label-key="name"
        value-key="id"
        expand-on-click-node
      ></UTree>
    </CustomCard>

    <CustomCard title="单选">
      <UTree
        :data="data"
        expand-all
        label-key="name"
        value-key="id"
        @node-click="handleNodeClick"
        selectable
      />

      select单选 {{ select }}
    </CustomCard>

    <CustomCard title="多选">
      <UTree
        :data="data"
        expand-all
        label-key="name"
        value-key="id"
        checkable
        @check="handleCheck"
      >
      </UTree>

      checkable多选 {{ checked }}
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { shallowRef } from 'vue'

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
  }
]

let select = ref({})
const checked = shallowRef([])
const handleNodeClick = (value: any) => {
  console.log(value, 'values')
  select.value = value
}

const handleCheck = (_, node, _checked) => {
  checked.value = _checked
}
</script>

<style lang="scss" scoped></style>
