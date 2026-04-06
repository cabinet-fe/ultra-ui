<template>
  <u-layout
    :class="cls.b"
    :cols="cols"
    rows="100%"
    gap="8px"
    resizable
    @keyup.esc="handleClose"
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
import type {
  BatchEditEmits,
  BatchEditFeature,
  BatchEditProps,
  TableColumnSlotsScope,
  TableExposed,
  TableRow
} from '@ui/types'
import { computed, inject, provide, shallowRef, watch } from 'vue'
import type { FormModel } from '../form'
import { ULayout } from '../layout'
import { bem } from '@ui/utils'
import { DialogDIKey } from '../dialog/di'
import { useEdit } from './use-edit'
import { BatchEditDIKey } from './di'
import BatchEditList from './batch-edit-list.vue'
import BatchEditForm from './batch-edit-form.vue'

defineOptions({ name: 'BatchEdit' })

const props = withDefaults(defineProps<BatchEditProps<Model>>(), {
  cols: () => ['1fr', '400px'],
  mode: 'normal'
})

const emit = defineEmits<BatchEditEmits>()

const staticFeatures = computed(() => {
  const { features } = props

  if (Array.isArray(features)) {
    return new Set(features)
  }

  const defaultFeatures = new Set<BatchEditFeature>([
    'create',
    'delete',
    'update',
    'createChild'
  ])

  if (!features) {
    return defaultFeatures
  }

  // 排除函数和false的部分
  Object.entries(features).forEach(([key, value]) => {
    if (typeof value === 'function' || value === false) {
      defaultFeatures.delete(key as BatchEditFeature)
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

  return {} as Record<
    BatchEditFeature,
    ((row?: TableRow) => boolean) | undefined
  >
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

const { state, handleClose } = editCtx

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

// 如果在dialog上下文中
dialogCtx &&
  watch(dialogCtx.visible, visible => {
    !visible && editCtx.handleClose()
  })

const cols = computed(() => {
  return !!state.row || state.visible ? props.cols : undefined
})
</script>
