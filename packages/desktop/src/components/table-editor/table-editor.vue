<template>
  <u-table
    ref="table"
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
    @keydown="handleKeydown"
  >
    <template #column:__operation="{ row }">
      <div
        :class="[cls.e('operations'), bem.is('active', isRowEditing(row.uid))]"
        :data-editor-row="row.uid"
      >
        <u-button
          text
          size="small"
          type="danger"
          :icon="Minus"
          title="移除"
          @click="handleDelete(row.index)"
        />
        <u-button
          text
          size="small"
          :icon="Plus"
          title="新增到下一行"
          @click="handleCreate(row.index)"
        />
        <u-button text size="small" :icon="Copy" title="复制到下一行" @click="handleCopy(row)" />
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
import { Copy, Minus, Plus, Warning } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import {
  h,
  toRaw,
  triggerRef,
  computed,
  nextTick,
  shallowRef,
  useSlots,
  useTemplateRef,
  watch
} from 'vue'

import type {
  TableEditorProps,
  TableEditorEmits,
  TableEditorColumn,
  _TableEditorExposed,
  TableExposed,
  TableColumn,
  TableColumnSlotsScope,
  TableColumnNode,
  RenderReturn
} from '../../types'
import { UButton } from '../button'
import { validateField } from '../form-item/validate'
import { UIcon } from '../icon'
import { UTable } from '../table'
import type { TableRowNode } from '../table/node/row'
import { UTip } from '../tip'

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
  width: 104,
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

// --- 录入导航（新增聚焦 / Enter、Tab 跨格移动） ---

const tableRef = useTemplateRef<TableExposed>('table')

/** 声明了 `#column:key` 插槽的列在 columns 中的下标，按列定义顺序，即焦点遍历顺序 */
const editableIndexes = computed(() =>
  columns.flatMap((column, i) => (slots[`column:${column.key}`] ? [i] : []))
)

/** 表内全部数据行元素，按行序排列；以操作列的 data-editor-row 标记识别 */
function findDataRows(): HTMLTableRowElement[] {
  const root = tableRef.value?.el
  if (!root) return []
  return Array.from(root.querySelectorAll('tr')).filter((tr) =>
    tr.querySelector('[data-editor-row]')
  )
}

/** 列下标 → 行内 td；行首可能存在展开列占位，按 td 总数与内部列数之差对齐 */
function cellAt(tr: HTMLTableRowElement, columnIndex: number): HTMLTableCellElement | null {
  const base = tr.cells.length - internalColumns.value.length
  return tr.cells[base + columnIndex] ?? null
}

/**
 * 行内沿 dir 方向、td 下标越过 bound 后的第一个可编辑单元格：
 * dir 为 1 时取 bound 之后第一个，为 -1 时取 bound 之前最后一个。
 */
function nearestEditableCell(
  tr: HTMLTableRowElement,
  bound: number,
  dir: 1 | -1
): HTMLTableCellElement | null {
  const base = tr.cells.length - internalColumns.value.length
  const indexes = dir > 0 ? editableIndexes.value : [...editableIndexes.value].reverse()
  for (const index of indexes) {
    const offset = base + index
    if (dir > 0 ? offset > bound : offset < bound) return tr.cells[offset] ?? null
  }
  return null
}

/** 从当前单元格起沿 dir 找下一个可编辑单元格，行末/行首跨到相邻行 */
function findNavTarget(td: HTMLTableCellElement, dir: 1 | -1): HTMLTableCellElement | null {
  const tr = td.closest('tr')
  if (!tr) return null
  const rows = findDataRows()
  const from = rows.indexOf(tr)
  if (from === -1) return null
  const tdIndex = Array.from(tr.cells).indexOf(td)
  for (let r = from; r >= 0 && r < rows.length; r += dir) {
    const row = rows[r]
    if (!row) break
    const bound = r === from ? tdIndex : dir > 0 ? -1 : row.cells.length
    const cell = nearestEditableCell(row, bound, dir)
    if (cell) return cell
  }
  return null
}

/**
 * 聚焦目标单元格内的可聚焦元素。
 * 目标行不在编辑态时先置入编辑态（复用「行内含焦点即编辑态」判定），
 * 待编辑内容挂载后再聚焦；编辑插槽内无可聚焦元素时回收预置的编辑态。
 */
async function focusEditableCell(td: HTMLTableCellElement) {
  const tr = td.closest('tr')
  const rowKey = tr ? resolveRowKey(tr) : undefined
  if (!rowKey || !td.isConnected) return
  let forced = false
  if (!isRowEditing(rowKey)) {
    const next = new Set(focusedRowKeys.value)
    next.add(rowKey)
    focusedRowKeys.value = next
    forced = true
    await nextTick()
  }
  const editable = td.querySelector<HTMLElement>(EDITABLE_SELECTOR)
  if (editable) {
    editable.focus()
  } else if (forced) {
    const next = new Set(focusedRowKeys.value)
    next.delete(rowKey)
    focusedRowKeys.value = next
  }
}

/** 编辑单元格内 Enter / Tab 移到下一个可编辑单元格，Shift+Tab 反向 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== 'Tab') return
  const target = e.target
  if (!(target instanceof Element) || !target.matches(EDITABLE_SELECTOR)) return
  const td = target.closest('td')
  const tr = td?.closest('tr')
  if (!td || !tr || !resolveRowKey(tr)) return
  e.preventDefault()
  const dir: 1 | -1 = e.key === 'Tab' && e.shiftKey ? -1 : 1
  const next = findNavTarget(td, dir)
  if (next) void focusEditableCell(next)
}

// --- 按列校验 ---

/** 行数据（以原始对象为键）→ 列 key → 错误信息 */
const cellErrors = shallowRef(new Map<Record<string, any>, Map<string, string>>())

/** 行节点 data 可能是响应式代理，统一取原始对象作为键 */
const errorRowKey = (rowData: Record<string, any>) => toRaw(rowData) as Record<string, any>

function getCellError(rowData: Record<string, any>, key: string) {
  return cellErrors.value.get(errorRowKey(rowData))?.get(key)
}

function setCellError(rowData: Record<string, any>, key: string, message: string | undefined) {
  const row = errorRowKey(rowData)
  const rowErrors = cellErrors.value.get(row)

  if (!message) {
    if (!rowErrors?.delete(key)) return
  } else {
    if (rowErrors?.get(key) === message) return
    if (rowErrors) rowErrors.set(key, message)
    else cellErrors.value.set(row, new Map([[key, message]]))
  }

  triggerRef(cellErrors)
}

/** 丢弃同一单元格过期的异步校验结果 */
const validateSeqs = new WeakMap<Record<string, any>, Map<string, number>>()

/** 单元格级校验：以行数据为 formData、列 key 为 field，结果同步到错误状态 */
async function validateCell(
  rowData: Record<string, any>,
  key: string,
  rules: TableEditorColumn['rules']
) {
  if (!rules) return

  const row = errorRowKey(rowData)
  let seqs = validateSeqs.get(row)
  if (!seqs) {
    seqs = new Map()
    validateSeqs.set(row, seqs)
  }
  const seq = (seqs.get(key) ?? 0) + 1
  seqs.set(key, seq)

  const message = await validateField(rowData, key, rules)
  if (seqs.get(key) !== seq) return
  // 校验是异步的，期间行可能已被移出模型（整体替换/删除）；
  // 把结果写回「死行」会绕过清理 watch 永久残留，直接丢弃
  if (!modelValue.some((item) => errorRowKey(item) === row)) return

  setCellError(row, key, message)
}

/** 整表校验：全部通过 resolve true，任一失败 resolve false */
async function validate() {
  const ruleColumns = columns.filter((column) => column.rules)

  await Promise.all(
    modelValue.flatMap((row) =>
      ruleColumns.map((column) => validateCell(row, column.key, column.rules))
    )
  )

  return !modelValue.some((row) => cellErrors.value.get(errorRowKey(row))?.size)
}

// 行删除（或整体替换）后，同步清理已不存在的行数据上的错误
watch(
  () => modelValue,
  (rows) => {
    if (!cellErrors.value.size) return

    const aliveRows = new Set(rows.map(errorRowKey))
    const next = new Map<Record<string, any>, Map<string, string>>()
    let changed = false

    for (const [row, errors] of cellErrors.value) {
      if (aliveRows.has(row)) next.set(row, errors)
      else changed = true
    }

    if (changed) cellErrors.value = next
  }
)

/** 列 key → 该列全部未通过信息（带行序号），驱动表头错误标识 */
const columnErrors = computed(() => {
  const map = new Map<string, string[]>()
  if (!cellErrors.value.size) return map

  for (const [row, errors] of cellErrors.value) {
    const index = modelValue.findIndex((item) => errorRowKey(item) === row)
    const label = index >= 0 ? `第 ${index + 1} 行：` : ''
    for (const [key, message] of errors) {
      const list = map.get(key) ?? []
      list.push(`${label}${message}`)
      map.set(key, list)
    }
  }
  return map
})

// --- 单元格双态渲染 ---

/**
 * 转交给 u-table 的插槽代理：
 * - 使用者声明的 `#column:key` 仅作编辑态内容，行处于编辑态时才调用；
 * - `#text:key` 覆盖文本态渲染，未声明时文本态渲染字段原始值；
 * - 所有配置列的 `column:key` 都经 renderCell 中转，校验失败的单元格才能统一包上错误标识；
 * - 配置列的 `header:key` 经 renderHeader 中转：required 追加红星，
 *   该列存在未通过项时文字标红并追加感叹号图标（气泡展示各行错误明细）；
 * - 其余插槽（row:expand / empty 等）原样透传。
 * 代理直接包在实时 slots 上，插槽增减无需维护副本失效。
 */
const cellSlots = new Proxy(slots, {
  get(target, prop) {
    if (typeof prop === 'string' && prop.startsWith('column:') && prop !== 'column:__operation') {
      const key = prop.slice('column:'.length)
      if (columns.some((item) => item.key === key)) {
        return (ctx: TableColumnSlotsScope) => renderCell(key, ctx)
      }
    }

    if (typeof prop === 'string' && prop.startsWith('header:')) {
      const key = prop.slice('header:'.length)
      const column = columns.find((item) => item.key === key)
      if (column) return (ctx: { column: TableColumnNode }) => renderHeader(key, column, ctx)
    }

    return Reflect.get(target, prop)
  }
})

/**
 * 表头渲染：required 列表头追加红星；该列存在未通过项时文字标红并追加
 * 感叹号图标，悬停经 UTip 气泡展示各行错误明细。
 * 渲染函数内读取 columnErrors 建立响应依赖，错误出现/消失即时更新表头。
 */
function renderHeader(key: string, column: TableEditorColumn, ctx: { column: TableColumnNode }) {
  const messages = columnErrors.value.get(key)
  const nodes = [
    h(
      'span',
      { class: [cls.e('header-text'), bem.is('error', !!messages?.length)] },
      slots[`header:${key}`]?.(ctx) ?? column.name
    )
  ]

  if (column.rules?.required) {
    nodes.push(h('span', { class: cls.e('required-mark'), 'aria-hidden': 'true' }, '*'))
  }

  if (messages?.length) {
    nodes.push(
      h(
        UTip,
        { key: 'header-error-tip' },
        {
          default: () =>
            h(UIcon, { size: 14, class: cls.e('header-icon') }, { default: () => h(Warning) }),
          content: () => messages.map((message) => h('div', { key: message }, message))
        }
      )
    )
  }

  return nodes
}

/** 编辑态走 `#column:key` 插槽，其余时刻走文本态；校验失败的单元格包上错误标识与 tip */
function renderCell(key: string, ctx: TableColumnSlotsScope): RenderReturn {
  const editSlot = slots[`column:${key}`]
  let content: RenderReturn
  if (editSlot && isRowEditing(ctx.row.uid)) {
    content = editSlot({ ...ctx, model: createCellModel(ctx) })
  } else {
    content = slots[`text:${key}`]?.(ctx) ?? ctx.val
  }

  const error = getCellError(ctx.rowData, key)
  if (!error) return content

  // UTip 以默认插槽首个普通节点为触发元素，错误标识类名放在触发元素上；
  // 错误样式用 outline 描边不占布局，出现/消失不改变行高
  return h(
    UTip,
    { content: error },
    { default: () => h('span', { class: cls.e('cell-error') }, [content]) }
  )
}

/**
 * 编辑态 model：值先原地写回行数据（行节点与 DOM 得以复用，输入不丢焦点），
 * 再以浅拷贝数组经 update:modelValue 通知宿主，维持 v-model 契约。
 * 列配置了 rules 时，值变更实时触发单元格级校验。
 */
function createCellModel(ctx: TableColumnSlotsScope) {
  const { rowData, column, val } = ctx
  const rules = (column.data as TableEditorColumn).rules
  return {
    modelValue: val,
    'onUpdate:modelValue': (value: any) => {
      rowData[column.key] = value
      emit('update:modelValue', [...modelValue])
      if (rules) void validateCell(rowData, column.key, rules)
    }
  }
}

async function handleCreate(index?: number) {
  if (index !== undefined) {
    emit('update:modelValue', [
      ...modelValue.slice(0, index + 1),
      {},
      ...modelValue.slice(index + 1)
    ])
  } else {
    emit('update:modelValue', [...modelValue, {}])
  }

  // 等新行挂载后，自动聚焦该行第一个可编辑单元格
  await nextTick()
  const rowIndex = index !== undefined ? index + 1 : modelValue.length - 1
  const tr = findDataRows()[rowIndex]
  const first = editableIndexes.value[0]
  if (!tr || first === undefined) return
  const cell = cellAt(tr, first)
  if (cell) void focusEditableCell(cell)
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

defineExpose<_TableEditorExposed>({ validate })
</script>
