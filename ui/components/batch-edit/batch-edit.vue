<template>
  <u-layout
    :class="cls.b"
    :cols="cols"
    rows="100%"
    gap="8px"
    :resizable="resizable"
    @keyup.esc="handleClose"
  >
    <BatchEditList :slots="slots">
      <slot name="header" />
    </BatchEditList>
    <BatchEditForm v-slot="scoped">
      <!-- @vue-ignore -->
      <slot name="form" v-bind="scoped" />
    </BatchEditForm>
  </u-layout>
</template>

<script lang="ts" setup generic="Model extends FormModel">
import type {
  BatchEditEmits,
  BatchEditProps
} from '@ui/types/components/batch-edit'
import { computed, inject, provide, shallowRef, watch } from 'vue'
import {
  type TableColumnSlotsScope,
  type TableExposed,
  type TableRow
} from '../table'
import { type FormModel } from '../form'
import { ULayout } from '../layout'
import { bem } from '@ui/utils'
import { DialogDIKey } from '../dialog/di'
import { useEdit } from './use-edit'
import { BatchEditDIKey } from './di'
import BatchEditList from './batch-edit-list.vue'
import BatchEditForm from './batch-edit-form.vue'

defineOptions({
  name: 'BatchEdit'
})

const props = withDefaults(defineProps<BatchEditProps<Model>>(), {
  cols: () => ['1fr', '400px'],
  resizable: true,
  mode: 'normal'
})

const emit = defineEmits<BatchEditEmits>()

const slots = defineSlots<
  {
    form?: (props: {
      /** 表单数据 */
      data: Model['data']
      /** 表单模型 */
      model: Model
      /** 当前编辑的行 */
      row?: TableRow
      /** 当前编辑的行索引 */
      index?: number
      /** 操作的目标行索引路径 */
      indexes?: number[]
    }) => any

    header?: () => any
  } & Partial<{
    [key: `column:${string}`]: (props: TableColumnSlotsScope) => any
  }>
>()

const cls = bem('batch-edit')

const tableRef = shallowRef<TableExposed>()

const editCtx = useEdit({
  props,
  emit,
  tableRef
})

const { state, handleClose } = editCtx

provide(BatchEditDIKey, {
  cls,
  props,
  tableRef,
  ...editCtx
})

const dialogCtx = inject(DialogDIKey, undefined)

// 如果在dialog上下文中
dialogCtx &&
  watch(dialogCtx.visible, visible => {
    !visible && editCtx.handleClose()
  })

const cols = computed(() => {
  return !!state.row || state.visible ? props.cols : undefined
})
</script>
