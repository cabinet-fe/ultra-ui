<template>
  <div>
    <u-table :columns="columns" :data="data">
      <template #column:action>
        <u-action-group>
          <u-action>编辑</u-action>
          <u-action>查看</u-action>
          <u-action>审批</u-action>
          <u-action need-confirm type="danger">删除</u-action>
        </u-action-group>
      </template>
    </u-table>
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns } from 'ultra-ui/components'

const columns = defineTableColumns([
  { name: '列1', key: 'col1' },
  { name: '列2', key: 'col2' },
  { name: '列3', key: 'col3' },
  { name: 'action', key: 'action', minWidth: 200 }
])

const data = Array.from({ length: 10 }).map((item, i) => {
  return {
    col1: 'col1-' + i,
    col2: 'col2-' + i,
    col3: 'col3-' + i
  }
})
</script>
