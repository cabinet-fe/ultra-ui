<template>
  <u-table :columns="columns" :data="data" @row-click="handleRowClick">
    <template #append>
      <u-tip
        v-model:visible="visible"
        :trigger-dom="triggerDom"
        trigger="click"
        style="width: 1000px"
      >
        <template #content>
          <div>新增</div>
          <u-form
            :model="props.model"
            :readonly="props.readonly"
            :label-width="props.labelWidth"
          >
            <template #default="{ data, model }">
              <slot name="form" v-bind="{ data, model }" />
            </template>
          </u-form>
          <div>
            <u-button type="primary" @click="">提交</u-button>
          </div>
        </template>
      </u-tip>
    </template>
  </u-table>
</template>

<script lang="ts" setup generic="Model extends FormModel">
import type { BatchEditProps, TableRow } from '@ui/types'
import { type FormModel } from '../form'
import { UTable } from '../table'
import { UTip } from '../tip'
import { shallowRef } from 'vue'

defineOptions({
  name: 'BatchEdit'
})

const props = withDefaults(defineProps<BatchEditProps<Model>>(), {})

const visible = shallowRef(false)

const triggerDom = shallowRef<HTMLElement>()

function handleRowClick(row: TableRow, e: MouseEvent) {
  visible.value = true
  triggerDom.value = e.currentTarget as HTMLElement
  console.log(row)
}
</script>
