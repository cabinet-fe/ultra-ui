<template>
  <u-table
    :columns="internalColumns"
    :data="modelValue || []"
    :class="cls.b"
    :stripe="false"
    show-index
    :slots="cellSlots"
    @mouseover="trackHover"
    @mouseleave="leaveHover"
    @focusin="trackFocusIn"
    @focusout="trackFocusOut"
  >
    <template #column:__operation="{ row }">
      <div :class="cls.e('operations')" :data-editor-row="row.uid">
        <u-button type="danger" @click="handleDelete(row.index)" :icon="Minus" title="移除" />
        <u-button :icon="Plus" @click="handleCreate(row.index)" title="新增到下一行" />
        <u-button :icon="Copy" @click="handleCopy(row)" title="复制到下一行" />
      </div>
    </template>

    <!-- <template #header:__operation> </template> -->

    <template #empty>
      <div style="text-align: center; padding: 4px 0">
        <u-button
          text
          size="small"
          type="primary"
          v-if="!modelValue.length"
          :icon="Plus"
          @click="handleCreate()"
          >添加</u-button
        >
      </div>
    </template>
  </u-table>
</template>

<script lang="ts" setup>
import { Copy, Minus, Plus } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, shallowRef, useSlots } from 'vue'

import type {
  TableEditorProps,
  TableEditorEmits,
  TableColumn,
  TableColumnSlotsScope,
  RenderReturn
} from '../../types'
import { UButton } from '../button'
import { UTable } from '../table'
import type { TableRowNode } from '../table/node/row'

defineOptions({ name: 'UTableEditor' })

defineSlots<{
  [key: `column:${string}`]: (props: TableColumnSlotsScope) => any
  [key: `text:${string}`]: (props: TableColumnSlotsScope) => any
}>()

const { columns = [], modelValue = [] } = defineProps<TableEditorProps>()
const emit = defineEmits<TableEditorEmits>()

const cls = bem('table-editor')

const slots = useSlots()

const actionColumn: TableColumn = {
  key: '__operation',
  name: '操作', // 使用name而不是title
  width: 120,
  align: 'center',
  fixed: 'right',
  resizable: false
}

// 内部列定义，添加编辑和删除操作列
const internalColumns = computed(() => {
  return [...columns, actionColumn]
})

// --- 行编辑态（编辑态 = 悬停 或 行内含聚焦输入） ---

/** 行标识统一转字符串，与 DOM data 属性解析结果直接比较 */
const toRowKey = (uid: number | string) => String(uid)

/** 悬停行的标识；null 表示不在任何数据行上 */
const hoverRowKey = shallowRef<string | null>(null)

/** 行内含聚焦输入的行标识集合；以整体替换 Set 触发依赖更新 */
const focusedRowKeys = shallowRef<ReadonlySet<string>>(new Set())

const isRowEditing = (uid: number | string) =>
  hoverRowKey.value === toRowKey(uid) || focusedRowKeys.value.has(toRowKey(uid))

/** tr 元素 → 行标识缓存，避免高频 mouseover 反复查询 DOM */
const rowKeyCache = new WeakMap<HTMLTableRowElement, string | null>()

/**
 * 从事件目标解析所在数据行的标识。
 * 返回 null 表示确定不在数据行上，undefined 表示无法判定（如目标不在表格内）。
 */
function resolveRowKey(target: EventTarget | null): string | null | undefined {
  if (!(target instanceof Element)) return undefined
  const tr = target.closest('tr')
  if (!tr) return undefined
  let key = rowKeyCache.get(tr)
  if (key === undefined) {
    key = tr.querySelector('[data-editor-row]')?.getAttribute('data-editor-row') ?? null
    rowKeyCache.set(tr, key)
  }
  return key
}

function trackHover(e: MouseEvent) {
  const key = resolveRowKey(e.target)
  if (key === undefined || key === hoverRowKey.value) return
  hoverRowKey.value = key
}

function leaveHover() {
  hoverRowKey.value = null
}

/** 仅输入类元素视为「聚焦输入」，操作列按钮等不维持编辑态 */
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable], [contenteditable] *'

function trackFocusIn(e: FocusEvent) {
  const target = e.target
  if (!(target instanceof Element) || !target.matches(EDITABLE_SELECTOR)) return
  const key = resolveRowKey(target)
  if (!key || focusedRowKeys.value.has(key)) return
  const next = new Set(focusedRowKeys.value)
  next.add(key)
  focusedRowKeys.value = next
}

function trackFocusOut(e: FocusEvent) {
  const target = e.target
  if (!(target instanceof Element)) return
  const key = resolveRowKey(target)
  if (!key || !focusedRowKeys.value.has(key)) return
  // 焦点仍在同一行内（如行内切换输入框）时不解除编辑态
  const related = e.relatedTarget
  if (related instanceof Element && resolveRowKey(related) === key) return
  const next = new Set(focusedRowKeys.value)
  next.delete(key)
  focusedRowKeys.value = next
}

// --- 单元格双态渲染 ---

/**
 * 转交给 u-table 的插槽代理：
 * - 使用者声明的 `#column:key` 仅作编辑态内容，行处于编辑态时才调用；
 * - `#text:key` 覆盖文本态渲染，未声明时文本态渲染字段原始值；
 * - 其余插槽（header: / row:expand / empty 等）原样透传。
 * 代理直接包在实时 slots 上，插槽增减无需维护副本失效。
 */
const cellSlots = new Proxy(slots, {
  get(target, prop) {
    if (typeof prop === 'string' && prop.startsWith('column:') && prop !== 'column:__operation') {
      const key = prop.slice('column:'.length)
      if (target[`column:${key}`] || target[`text:${key}`]) {
        return (ctx: TableColumnSlotsScope) => renderCell(key, ctx)
      }
    }
    return Reflect.get(target, prop)
  }
})

/** 编辑态走 `#column:key` 插槽，其余时刻走文本态 */
function renderCell(key: string, ctx: TableColumnSlotsScope): RenderReturn {
  const editSlot = slots[`column:${key}`]
  if (editSlot && isRowEditing(ctx.row.uid)) {
    return editSlot({ ...ctx, model: createCellModel(ctx) })
  }
  return slots[`text:${key}`]?.(ctx) ?? ctx.val
}

/**
 * 编辑态 model：值先原地写回行数据（行节点与 DOM 得以复用，输入不丢焦点），
 * 再以浅拷贝数组经 update:modelValue 通知宿主，维持 v-model 契约。
 */
function createCellModel(ctx: TableColumnSlotsScope) {
  const { rowData, column, val } = ctx
  return {
    modelValue: val,
    'onUpdate:modelValue': (value: any) => {
      rowData[column.key] = value
      emit('update:modelValue', [...modelValue])
    }
  }
}

function handleCreate(index?: number) {
  if (index !== undefined) {
    emit('update:modelValue', [
      ...modelValue.slice(0, index + 1),
      {},
      ...modelValue.slice(index + 1)
    ])
  } else {
    emit('update:modelValue', [...modelValue, {}])
  }
}

function handleCopy(row: TableRowNode) {
  emit('update:modelValue', [
    ...modelValue.slice(0, row.index + 1),
    JSON.parse(JSON.stringify(row.data)),
    ...modelValue.slice(row.index + 1)
  ])
}

function handleDelete(index: number) {
  emit(
    'update:modelValue',
    modelValue.filter((_, i) => i !== index)
  )
}
</script>
