<template>
  <u-table :columns="columnsWithOperation" :data="data" :stripe="false">
    <template #column:__action__="{ row }">
      <u-button
        :icon="EditPen"
        circle
        text
        size="small"
        type="primary"
        @click="handleRowClick(row, $event)"
      ></u-button>
    </template>

    <template #append>
      <u-tip
        :visible="visible && !!model"
        :trigger-dom="triggerDom"
        trigger="click"
        alignment="start"
        style="width: 1000px"
      >
        <template #content>
          <div>编辑</div>
          <u-form
            :model="model!"
            :readonly="readonly"
            :label-width="labelWidth"
            :cols="3"
          >
            <template #default="{ data, model }">
              <slot name="form" v-bind="{ data, model }" />
            </template>
          </u-form>
          <div style="text-align: right">
            <u-button @click="visible = false" type="primary" text>
              关闭
            </u-button>
            <u-button type="primary" @click="handleSubmit">提交</u-button>
          </div>
        </template>
      </u-tip>
    </template>
  </u-table>
</template>

<script lang="ts" setup>
import type { BatchEditProps, TableColumn, TableRow } from '@ui/types'
import { type FormModel, UForm } from '../form'
import { UTable } from '../table'
import { UTip } from '../tip'
import { computed, shallowRef } from 'vue'
import { UButton } from '../button'
import { EditPen } from 'icon-ultra'

defineOptions({
  name: 'BatchEdit'
})

const { columns = [] } = defineProps<BatchEditProps<FormModel>>()

const columnsWithOperation = computed<TableColumn[]>(() => {
  return [
    ...columns,
    {
      name: '操作',
      key: '__action__',
      align: 'center',
      fixed: 'right'
    }
  ]
})

const visible = shallowRef(false)

const triggerDom = shallowRef<HTMLElement>()

function handleRowClick(row: TableRow, e: MouseEvent) {
  triggerDom.value = e.currentTarget as HTMLElement

  visible.value = false
  setTimeout(() => {
    visible.value = true
  })
}

function handleSubmit() {
  visible.value = false
}
</script>
