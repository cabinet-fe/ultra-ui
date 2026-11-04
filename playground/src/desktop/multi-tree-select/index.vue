<template>
  <div>
    <CustomCard title="菜单选择器多选、禁用某项、过滤" style="width: 200px">
      多选{{ treeCheckable }}
      <u-multi-tree-select
        v-model="treeCheckable"
        :data="data"
        label-key="name"
        value-key="id"
        children-key="children"
        check-strictly
        checkable
        :disabledNode="disabledNode"
        filterable
        @change="handleChange"
      ></u-multi-tree-select>
    </CustomCard>

    <CustomCard title="只有叶子节点显示复选框" style="width: 200px">
      多选{{ leafOnly }}
      <u-multi-tree-select
        v-model="leafOnly"
        :data="data"
        label-key="name"
        value-key="id"
        children-key="children"
        expand-all
        :show-checkbox="showLeafCheckbox"
        @change="handleChange"
      ></u-multi-tree-select>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import type { TreeNode } from '@veltra/desktop'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'
import { TreeData } from '../form/data'

const treeCheckable = shallowRef(['8', '9'])

const leafOnly = shallowRef(['8-0', '9-0'])

const disabledNode = (data) => {
  return data.id % 4 === 0
}

/** 父节点隐藏复选框，叶子正常显示 */
const showLeafCheckbox = (_data: Record<string, any>, node: TreeNode) => !node.children?.length

const data = shallowRef<any[]>([])

setTimeout(() => {
  data.value = TreeData
}, 2000)

const handleChange = (value) => {}
</script>
