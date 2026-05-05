<template>
  <u-layout
    :class="cls.b"
    :cols="cols"
    rows="100%"
    gap="8px"
    resizable
    @keydown="handleKeydown"
    tabindex="-1"
  >
    <!-- 编辑列表 -->
    <BatchEditList :slots="slots" />

    <!-- 编辑表单 -->
    <BatchEditForm v-slot="scoped">
      <!-- @vue-ignore -->
      <slot name="form" v-bind="scoped" />
    </BatchEditForm>
  </u-layout>
</template>

<script lang="ts" setup generic="Model extends FormModel">
import { bem } from '@veltra/utils'
import { computed, inject, provide, shallowRef, watch } from 'vue'

import type {
  BatchEditEmits,
  BatchEditFeature,
  BatchEditProps,
  TableColumnSlotsScope,
  TableExposed,
  TableRow
} from '../../types'
import { DialogDIKey } from '../dialog/di'
import type { FormModel } from '../form'
import { ULayout } from '../layout'
import BatchEditForm from './batch-edit-form.vue'
import BatchEditList from './batch-edit-list.vue'
import { BatchEditDIKey } from './di'
import { useEdit } from './use-edit'

defineOptions({ name: 'BatchEdit' })

const props = withDefaults(defineProps<BatchEditProps<Model>>(), {
  cols: () => ['1fr', '420px'],
  mode: 'normal'
})

const emit = defineEmits<BatchEditEmits>()

const staticFeatures = computed(() => {
  const { features } = props

  if (Array.isArray(features)) {
    return new Set(features)
  }

  const defaultFeatures = new Set<BatchEditFeature>(['create', 'delete', 'update', 'createChild'])

  if (!features) {
    return defaultFeatures
  }

  // 函数与 false 的特性视为关闭；显式 true 视为开启（即便不在默认集合内）
  Object.entries(features).forEach(([key, value]) => {
    const k = key as BatchEditFeature
    if (typeof value === 'function' || value === false) {
      defaultFeatures.delete(k)
    } else if (value === true) {
      defaultFeatures.add(k)
    }
  })
  return defaultFeatures
})

const dynamicFeatures = computed<
  Record<BatchEditFeature, ((row?: TableRow) => boolean) | undefined>
>(() => {
  const { features } = props
  if (!Array.isArray(features) && typeof features === 'object') {
    const ret = Object.entries(features)
      .filter(([_, value]) => {
        return typeof value === 'function'
      })
      .reduce(
        (acc, [key, value]) => {
          acc[key] = value
          return acc
        },
        {} as Record<BatchEditFeature, (row?: TableRow) => boolean>
      )
    return ret
  }

  return {} as Record<BatchEditFeature, ((row?: TableRow) => boolean) | undefined>
})

const slots = defineSlots<
  {
    form?: (props: {
      /** 表单数据 */
      data: Model['data']
      /** 表单模型 */
      model: Model
      /** 当前编辑的层级 */
      depth?: number
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

const editCtx = useEdit({ props, emit, tableRef })

const { state, handleClose, handleSave, handleDelete, handleCreate } = editCtx

provide(BatchEditDIKey, {
  cls,
  props,
  emit,
  tableRef,
  staticFeatures,
  dynamicFeatures,
  ...editCtx
})

const dialogCtx = inject(DialogDIKey, undefined)

dialogCtx &&
  watch(dialogCtx.visible, (visible) => {
    !visible && editCtx.handleClose()
  })

const cols = computed(() => {
  return !!state.row || state.visible ? props.cols : undefined
})

/**
 * 键盘快捷键：
 * - Esc        关闭表单
 * - ⌘/Ctrl + S   保存
 * - ⌘/Ctrl + Backspace 删除当前编辑行
 * - ⌘/Ctrl + N   新增（仅在不在表单中时）
 */
function handleKeydown(e: KeyboardEvent) {
  if (props.readonly && e.key !== 'Escape') return

  if (e.key === 'Escape') {
    if (state.visible) {
      e.preventDefault()
      handleClose()
    }
    return
  }

  const meta = e.metaKey || e.ctrlKey
  if (!meta) return

  const key = e.key.toLowerCase()

  if (key === 's' && state.visible) {
    e.preventDefault()
    handleSave()
    return
  }

  if (e.key === 'Backspace' && state.row && state.type === 'update') {
    e.preventDefault()
    handleDelete(state.row)
    return
  }

  if (key === 'n' && !state.visible) {
    e.preventDefault()
    handleCreate()
  }
}
</script>
