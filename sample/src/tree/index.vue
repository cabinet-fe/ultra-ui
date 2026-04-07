<template>
  <div>
    <CustomCard title="全部展开,过滤">
      <div>查询: <u-input v-model="qs" style="width: 200px"></u-input></div>
      <div style="padding: 4px 0; display: flex; gap: 12px">
        <div>
          多选:
          <u-switch v-model="config.checkable" @update:model-value="handleUpdateCheckable" />
        </div>
        <div>
          单选
          <u-switch v-model="config.selectable" @update:model-value="handleUpdateSelectable" />
        </div>
        <div>展开所有 <u-switch v-model="config.expandAll" /></div>
        <div>点击节点展开 <u-switch v-model="config.expandOnClickNode" /></div>
        <div>
          严格选择
          <u-switch
            v-model="config.checkStrictly"
            @update:model-value="handleUpdateCheckStrictly"
          />
        </div>
      </div>
      <UTree
        :data="data1"
        label-key="name"
        value-key="id"
        ref="treeRef"
        height="200px"
        v-model:checked="checked"
        @update:selected="handleNodeClick"
        @update:checked="handleCheck"
        :disabled-node="disabledNode"
        v-bind="config"
      />
      {{ checked }}
    </CustomCard>

    <CustomCard title="自定义内容">
      <UTree :data="data" expand-all label-key="name" value-key="id" height="100px" check-strictly>
        <template #default="{ data }">
          {{ data.name + '------' + data.id }}
        </template>
      </UTree>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import type { TreeExposed } from 'ultra-ui'
import CustomCard from '../card/custom-card.vue'
import { shallowReactive, shallowRef, watch } from 'vue'

const treeRef = shallowRef<TreeExposed>()
const treeRef1 = shallowRef<TreeExposed>()
const data = shallowRef<any[]>([])
const data1 = shallowRef<any[]>([])

const checked = shallowRef<any[]>()

function disabledNode(node) {
  return node.id === '0-1'
}

function refreshData() {
  data1.value = Array.from({ length: 1000 }).map((_, index) => ({
    name: '手抓饼' + index,
    id: `${index}`,
    children: [
      { name: '鱼香肉丝-1'.repeat(5), id: `${index}-1` },
      { name: '鱼香肉丝-2', id: `${index}-2` }
    ]
  }))
}

setTimeout(() => {
  refreshData()
}, 500)

setTimeout(() => {
  checked.value = ['0-1']
}, 1000)

const config = shallowReactive({
  checkable: true,
  selectable: false,
  expandAll: false,
  expandOnClickNode: false,
  checkStrictly: true
})

let select = shallowRef(9)

watch([select, treeRef1, data], ([select, tree]) => {}, { immediate: true })

const handleNodeClick = (selected) => {
  console.log('点击了节点', selected)
}

const handleCheck = (...args) => {
  console.log('选中了', ...args)
}

const handleUpdateCheckable = (value: boolean) => {
  if (value) {
    config.selectable = false
  } else {
    config.checkStrictly = false
  }
}

const handleUpdateSelectable = (value: boolean) => {
  if (value) {
    config.checkable = false
  }
}

const handleUpdateCheckStrictly = (value: boolean) => {
  if (value) {
    config.checkable = true
    config.selectable = false
  }
}

const qs = shallowRef('')

watch([qs], ([qs]) => {
  treeRef.value?.filter(qs)
})
</script>
