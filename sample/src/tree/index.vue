<template>
  <div>
    <CustomCard title="全部展开,过滤">
      <u-input v-model="qs"></u-input>
      <UTree
        style="margin-bottom: 10px"
        :data="data"
        label-key="name"
        value-key="id"
        expand-all
        ref="treeRef"
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
        :disabled-node="disabledNode"
        v-model:selected="select"
        @update:selected="handleNodeClick"
        selectable
      />

      select单选 {{ select }}
    </CustomCard>

    <CustomCard title="多选">
      <u-checkbox v-model="allChecked" @update:model-value="handleCheckAll">
        全选
      </u-checkbox>
      <UTree
        :data="data"
        expand-all
        label-key="name"
        value-key="id"
        checkable
        :disabled-node="disabledNode"
        @update:checked="handleCheck"
        v-model:checked="checked"
        ref="checkedTreeRef"
      >
      </UTree>

      checkable多选 {{ checked }}
    </CustomCard>

    <CustomCard title="父子不关联">
      <UTree
        :data="data"
        expand-all
        label-key="name"
        value-key="id"
        checkable
        check-strictly
        :disabled-node="disabledNode"
        v-model:checked="checked"
      />
    </CustomCard>

    <CustomCard title="自定义内容">
      <UTree
        :data="data"
        expand-all
        label-key="name"
        value-key="id"
        check-strictly
      >
        <template #default="{ data }">
          {{ data.name + '------' + data.id }}
        </template>
      </UTree>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import type { TreeExposed } from 'ultra-ui/components'
import CustomCard from '../card/custom-card.vue'
import { shallowRef, watch, watchEffect } from 'vue'

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

let select = shallowRef()
const checked = shallowRef([1])
const handleNodeClick = selected => {
  select.value = selected
}

const disabledNode = data => {
  return data.id % 2 === 0
}

const handleCheck = (...args) => {
  // checked.value = _checked
  console.log('选中了', ...args)
}

const qs = shallowRef('')

const treeRef = shallowRef<TreeExposed>()

watch([qs], ([qs]) => {
  treeRef.value?.filter(qs)
})



const checkedTreeRef = shallowRef<TreeExposed>()
const allChecked = shallowRef(false)
const handleCheckAll = (check: boolean) => {
  allChecked.value = check
  checkedTreeRef.value?.checkAll(check)
}
</script>

<style lang="scss" scoped></style>
