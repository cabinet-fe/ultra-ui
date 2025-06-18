<template>
  <u-table
    :columns="columnsWithOperation"
    :data="data"
    :current-row="currentRow"
    highlight-current
    :class="cls.b"
    checkable
  >
    <template #column:__action__="{ row }">
      <ButtonWrap tag="div" @click.stop>
        <u-button :icon="Edit" title="编辑" @click="handleEdit(row, $event)" />
        <u-button :icon="Plus" title="新增" @click="handleAdd(row, $event)" />
        <u-button
          :icon="AddChild"
          title="新增子项"
          @click="handleAdd(row, $event)"
        />
        <u-button :icon="Copy" title="复制" @click="handleCopy(row, $event)" />
        <u-button
          :icon="Delete"
          type="danger"
          title="删除"
          @click="handleDelete(row)"
        />
      </ButtonWrap>
    </template>

    <template #append>
      <u-tip
        :visible="visible && !!model"
        :trigger-dom="triggerDom"
        trigger="click"
        alignment="center"
        direction="left"
        :class="cls.e('tip')"
      >
        <template #content>
          <div :class="cls.e('form-title')">编辑</div>
          <u-scroll
            :class="cls.e('form-scroll')"
            :content-class="cls.e('form-scroll-content')"
          >
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
          </u-scroll>

          <div :class="cls.e('form-action')">
            <u-button @click="handleClose" type="primary" text> 关闭 </u-button>
            <u-button type="primary" @click="handleSubmit" v-if="!readonly">
              提交
            </u-button>
          </div>
        </template>
      </u-tip>
    </template>
  </u-table>
</template>

<script lang="ts" setup>
import type {
  BatchEditProps,
  ButtonProps,
  TableColumn,
  TableRow
} from '@ui/types'
import { type FormModel, UForm } from '../form'
import { UTable } from '../table'
import { UScroll } from '../scroll'
import { UTip } from '../tip'
import { computed, nextTick, shallowRef } from 'vue'
import { UButton } from '../button'
import { Copy, Edit, Delete, Plus, AddChild } from 'icon-ultra'
import { useComponentProps } from '@ui/compositions'
import { bem } from '@ui/utils'

defineOptions({
  name: 'BatchEdit'
})

const { columns = [], model, data } = defineProps<BatchEditProps<FormModel>>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>[]): void
}>()

const cls = bem('batch-edit')

const columnsWithOperation = computed<TableColumn[]>(() => {
  return [
    ...columns,
    {
      name: '操作',
      key: '__action__',
      align: 'center',
      fixed: 'right',
      width: 180
    }
  ]
})

const ButtonWrap = useComponentProps<ButtonProps>({
  size: 'small',
  circle: true,
  text: true,
  type: 'primary',
  style: { fontSize: '16px', marginRight: '6px' },
  loading: false
})

const visible = shallowRef(false)
const triggerDom = shallowRef<HTMLElement>()
const currentRow = shallowRef<TableRow>()

function open(row: TableRow) {
  close()
  nextTick(() => {
    visible.value = true
    model?.setData(row.data)
  })
}

function close() {
  model?.clearValidate()
  model?.resetData()
  visible.value = false
}

// watchEffect(() => {
//   if (!visible.value) {
//     model?.clearValidate()
//     model?.resetData()
//   }
// })

function handleRowClick(row: TableRow, e: MouseEvent) {}

function handleAdd(row: TableRow, e: MouseEvent) {
  console.log(row, e)
}

function handleEdit(row: TableRow, e: MouseEvent) {
  if (row === currentRow.value) {
    currentRow.value = undefined
    return close()
  } else {
    currentRow.value = row
    triggerDom.value = e.currentTarget as HTMLElement
    open(row)
  }
}

function handleCopy(row: TableRow, e: MouseEvent) {
  console.log(row, e)
}

function handleDelete(row: TableRow) {
  emit('update:modelValue', data?.filter((_, i) => i !== row.index) ?? [])
}

function handleClose() {
  close()
}

async function handleSubmit() {
  await model?.validate()
  visible.value = false
}
</script>
