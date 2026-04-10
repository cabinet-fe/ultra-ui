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
        checkable
        :disabledNode="disabledNode"
        filterable
        @change="handleChange"
      ></u-multi-tree-select>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'
import { TreeData } from '../form/data'

const treeCheckable = shallowRef(['8', '9'])

const disabledNode = (data) => {
  return data.id % 4 === 0
}
const data = shallowRef<any[]>([])

setTimeout(() => {
  data.value = TreeData
}, 2000)

const handleChange = (value) => {}
</script>
