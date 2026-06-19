<template>
  <u-layout
    :class="cls.b"
    :cols="cols"
    rows="minmax(0, 1fr)"
    gap="8px"
    resizable
    tabindex="-1"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
    @keydown.capture="handleKeydown"
  >
    <!-- 编辑列表 -->
    <BatchEditList :slots="slots" ref="tableRef" />

    <!-- 编辑表单 -->
    <BatchEditForm ref="formRef" v-slot="scoped">
      <slot name="form" v-bind="scoped" />
    </BatchEditForm>
  </u-layout>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, inject, provide, shallowRef, watch } from 'vue'

import type {
  BatchEditEmits,
  BatchEditProps,
  TableColumnSlotsScope,
  TableExposed,
  TableRow
} from '../../types'
import type { FormExposed } from '../../types/form'
import { DialogDIKey } from '../dialog/di'
import { ULayout } from '../layout'
import BatchEditForm from './batch-edit-form.vue'
import BatchEditList from './batch-edit-list.vue'
import { BatchEditDIKey } from './di'
import { useEdit } from './use-edit'
import { useFeatures } from './use-features'

defineOptions({ name: 'BatchEdit' })

const props = withDefaults(defineProps<BatchEditProps>(), {
  cols: () => ['1fr', '420px'],
  mode: 'normal'
})

const emit = defineEmits<BatchEditEmits>()

const slots = defineSlots<
  {
    form?: (props: {
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
  } & Partial<{ [key: `column:${string}`]: (props: TableColumnSlotsScope) => any }>
>()

const cls = bem('batch-edit')

const tableRef = shallowRef<TableExposed>()
const formRef = shallowRef<FormExposed>()
const focused = shallowRef(false)

const { staticFeatures, dynamicFeatures } = useFeatures({ props })

const editCtx = useEdit({ props, emit, formRef })

const { state, handleClose, handleSave } = editCtx

provide(BatchEditDIKey, {
  cls,
  props,
  emit,
  tableRef,
  staticFeatures,
  dynamicFeatures,
  focused,
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

function handleFocusIn() {
  focused.value = true
}

function handleFocusOut(e: FocusEvent) {
  const root = e.currentTarget as HTMLElement
  if (!root.contains(e.relatedTarget as Node | null)) {
    focused.value = false
  }
}

/**
 * 键盘快捷键（仅组件获焦时生效）：
 * - Esc          关闭表单
 * - ⌘/Ctrl + S   保存（快速编辑模式下编辑行时除外）
 */
function handleKeydown(e: KeyboardEvent) {
  if (!focused.value) return
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
    if (props.mode === 'quick' && state.type === 'update') return
    e.preventDefault()
    handleSave()
  }
}
</script>
