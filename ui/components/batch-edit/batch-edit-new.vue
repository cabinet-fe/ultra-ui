<template>
  <u-table
    :columns="columnsWithOperation"
    :data="data"
    :current-row="currentRow"
    @update:current-row="handleUpdateCurrentRow"
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
import { computed, nextTick, shallowRef, watch } from 'vue'
import { UButton } from '../button'
import { Copy, Edit, Delete, Plus, AddChild } from 'icon-ultra'
import { useComponentProps } from '@ui/compositions'
import { bem } from '@ui/utils'

defineOptions({
  name: 'BatchEdit'
})

const { columns = [], model, data } = defineProps<BatchEditProps<FormModel>>()

const emit = defineEmits<{
  (e: 'update:data', value: Record<string, any>[]): void
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

watch(visible, v => {
  if (!v) {
    model?.clearValidate()
    model?.resetData()
  }
})

watch(currentRow, r => {
  visible.value = !!r ? true : false
})

function handleUpdateCurrentRow(row?: TableRow) {
  currentRow.value = row
  if (!visible.value) {
    nextTick(() => {
      currentRow.value = undefined
    })
  }
}

function handleAdd(row: TableRow, e: MouseEvent) {
  console.log(row, e)
}

function handleEdit(row: TableRow, e: MouseEvent) {
  if (row === currentRow.value) {
    currentRow.value = undefined
  } else {
    triggerDom.value = e.currentTarget as HTMLElement
    if (!currentRow.value) {
      currentRow.value = row
      return model?.setData(row.data)
    }
    currentRow.value = undefined

    nextTick(() => {
      currentRow.value = row
      model?.setData(row.data)
    })
  }
}

function handleCopy(row: TableRow, e: MouseEvent) {
  console.log(row, e)
}

function handleDelete(row: TableRow) {
  emit('update:data', data?.filter((_, i) => i !== row.index) ?? [])
}

function handleClose() {
  currentRow.value = undefined
}

async function handleSubmit() {
  await model?.validate()
  visible.value = false
}
</script>
