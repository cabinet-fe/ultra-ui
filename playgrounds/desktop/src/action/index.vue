<template>
  <div>
    <div style="text-align: right">
      <u-action-group>
        <u-action v-for="button of buttons">{{ button }}</u-action>
        <u-action need-confirm type="danger">删除</u-action>
        <u-action need-confirm type="danger">删除</u-action>
      </u-action-group>
    </div>
    <div>
      <u-table :columns="columns" :data="data" show-index checkable>
        <template #column:action>
          <u-action-group :max="4">
            <u-action v-for="button of buttons">{{ button }}</u-action>
            <u-action need-confirm type="danger">删除</u-action>
            <u-action need-confirm type="danger">删除</u-action>
          </u-action-group>
        </template>
      </u-table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@ultra-ui/desktop'
import { shallowRef } from 'vue'

const columns = defineTableColumns([
  { name: '列1', key: 'col1' },
  { name: '列2', key: 'col2' },
  { name: '列3', key: 'col3' },
  { name: 'action', key: 'action', width: 150, align: 'center' }
])

const data = shallowRef<any[]>([])

setTimeout(() => {
  data.value = Array.from({ length: 10 }).map((item, i) => {
    return {
      col1: 'col1-' + i,
      col2: 'col2-' + i,
      col3: 'col3-' + i
    }
  })
}, 200)

const buttons = ['查看', '编辑', '审批']
</script>
