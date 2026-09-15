<template>
  <u-table
    ref="table"
    v-bind="tableProps"
    :columns="internalColumns"
    :data="modelValue || []"
    :class="cls.b"
    :stripe="false"
    show-index
    @keydown="handleKeydown"
  >
    <!-- 其余插槽（row:expand / foot / body / append 等）透传给 u-table；column:*、header:* 与 empty 由组件接管 -->
    <template v-for="name in passSlotNames" :key="name" #[name]="scope">
      <slot :name="name" v-bind="scope" />
    </template>

    <template #column:__operation="{ row }">
      <div :class="cls.e('operations')">
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

    <template #empty>
      <div style="text-align: center; padding: 4px 0">
        <u-button
          text
          size="small"
          type="primary"
          v-if="!readonly && !modelValue.length"
          :icon="Plus"
          @click="handleCreate()"
          >添加</u-button
        >
      </div>
    </template>
  </u-table>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
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
  TableColumnRenderContext,
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
  [key: `header:${string}`]: (props: { column: TableColumnNode }) => any
}>()

const {
  columns = [],
  modelValue = [],
  readonly = false,
  size,
  checked,
  selected,
  checkable,
  selectable,
  tree,
  mergeCell,
  current,
  highlightCurrent,
  rowKey,
  border,
  virtualThreshold,
  expandable,
  defaultExpandAll,
  textEllipsis
} = defineProps<TableEditorProps>()
const emit = defineEmits<TableEditorEmits>()

/** 转发给 u-table 的表格属性。columns / data / slots / stripe / showIndex 由编辑器接管，readonly 是编辑器自身属性；模板中写在 v-bind 之后的绑定覆盖这里的值 */
const tableProps = computed(() => ({
  size,
  checked,
  selected,
  checkable,
  selectable,
  tree,
  mergeCell,
  current,
  highlightCurrent,
  rowKey,
  border,
  virtualThreshold,
  expandable,
  defaultExpandAll,
  textEllipsis
}))

const cls = bem('table-editor')

const slots = useSlots()

const actionColumn: TableColumn = {
  key: '__operation',
  name: '操作',
  width: 104,
  align: 'center',
  fixed: 'right',
  resizable: false
}

/**
 * 内部列定义：单元格与表头渲染挂在列的 render / nameRender 上（用户列自带的优先），
 * 非只读时在用户列之后追加内置操作列，只读下不渲染操作列。
 * 走 u-table 的列渲染通道而非 slots 代理：列数组随 readonly / columns 变化整体重建，
 * 单元格内容跟着重算，不会出现插槽查找过期导致单元格滞留在纯文本的问题。
 * 列 key 带上只读态后缀：u-table 行内单元格在 props 值相等时可能跳过子组件补丁，
 * 只读切换改用挂载键直接重挂单元格，确保控件在编辑/只读形态间可靠切换。
 */
const internalColumns = computed<TableColumn[]>(() => {
  const list = columns.map((column) => ({
    ...column,
    key: `${column.key}${readonly ? ':ro' : ''}`,
    render: column.render ?? ((ctx: TableColumnRenderContext) => editCell(column, ctx)),
    nameRender:
      column.nameRender ?? ((ctx: { column: TableColumnNode }) => renderHeader(column, ctx))
  }))
  return readonly ? list : [...list, actionColumn]
})

/** 透传给 u-table 的插槽名：column:* / header:* / empty 由组件内部接管，其余（row:expand 等）透传 */
const passSlotNames = Object.keys(slots).filter(
  (name) => !name.startsWith('column:') && !name.startsWith('header:') && name !== 'empty'
)

// --- 录入导航（新增聚焦 / Enter、Tab 跨格移动） ---

/** 单元格内的可编辑控件；用于自动聚焦与 Enter/Tab 导航的目标识别 */
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable], [contenteditable] *'

const tableRef = useTemplateRef<TableExposed>('table')

/** 声明了 `#column:key` 插槽的列在 columns 中的下标，按列定义顺序，即焦点遍历顺序 */
const editableIndexes = computed(() =>
  columns.flatMap((column, i) => (slots[`column:${column.key}`] ? [i] : []))
)

/**
 * 表内全部数据行元素，按行序排列。
 * 数据行 = 主体 tbody 的直系 tr 且单元格多于一个：序号列常驻使数据行至少两格，
 * 展开行 / 空态行 / 虚拟滚动占位行都是单格 colspan 行；不依赖操作列标记，只读下同样成立。
 */
function findDataRows(): HTMLTableRowElement[] {
  const root = tableRef.value?.el
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLTableRowElement>('tbody.u-table__body > tr')).filter(
    (tr) => tr.cells.length > 1
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

/** 聚焦目标单元格内的可编辑控件；编辑控件常驻渲染，直接聚焦即可 */
function focusEditableCell(td: HTMLTableCellElement) {
  td.querySelector<HTMLElement>(EDITABLE_SELECTOR)?.focus()
}

/** 编辑单元格内 Enter / Tab 移到下一个可编辑单元格，Shift+Tab 反向 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== 'Tab') return
  const target = e.target
  if (!(target instanceof Element) || !target.matches(EDITABLE_SELECTOR)) return
  const td = target.closest('td')
  const tr = td?.closest('tr')
  // 与 findDataRows() 一致识别数据行，展开行内的控件不参与录入导航
  if (!td || !tr || !findDataRows().includes(tr)) return
  e.preventDefault()
  const dir: 1 | -1 = e.key === 'Tab' && e.shiftKey ? -1 : 1
  const next = findNavTarget(td, dir)
  if (next) focusEditableCell(next)
}

// --- 按列校验 ---

/** 行数据（以原始对象为键）→ 列 key → 错误信息 */
const cellErrors = shallowRef(new Map<Record<string, any>, Map<string, string>>())

/** 行节点 data 可能是响应式代理，统一取原始对象作为键 */
const errorRowKey = (rowData: Record<string, any>) => toRaw(rowData) as Record<string, any>

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

/**
 * 整表校验：自上而下逐行校验，某行存在未通过项即停止校验其后的行（懒校验）。
 * 全部通过 resolve true，否则 resolve false。
 */
async function validate() {
  const ruleColumns = columns.filter((column) => column.rules)

  for (const row of modelValue) {
    await Promise.all(ruleColumns.map((column) => validateCell(row, column.key, column.rules)))
    if (cellErrors.value.get(errorRowKey(row))?.size) return false
  }

  return true
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

// --- 单元格渲染 ---

/** 声明了 `#column:key` 插槽的列调用编辑插槽（注入 model），未声明的渲染字段原始值 */
function editCell(column: TableEditorColumn, ctx: TableColumnRenderContext): RenderReturn {
  const editSlot = slots[`column:${column.key}`]
  // 内部列 key 带只读态后缀，u-table 按 key 取到的 val 失效，这里按原始列 key 重取
  const val = o(ctx.rowData).get(column.key)
  if (!editSlot) return val
  const scope = { ...ctx, val }
  return editSlot({ ...scope, model: createCellModel(column, scope) })
}

/**
 * 单元格编辑 model：值先原地写回行数据（行节点与 DOM 得以复用，输入不丢焦点），
 * 再以浅拷贝数组经 update:modelValue 通知宿主，维持 v-model 契约。
 * 只读下注入 readonly: true 且不提供写回通道，值不可修改；
 * 列配置了 rules 时，控件的 change 事件（如失焦提交）触发单元格级校验，输入过程不校验。
 */
function createCellModel(column: TableEditorColumn, ctx: TableColumnRenderContext) {
  const { rowData, val } = ctx
  const key = column.key
  const rules = column.rules
  return {
    modelValue: val,
    ...(readonly
      ? { readonly: true }
      : {
          'onUpdate:modelValue': (value: any) => {
            rowData[key] = value
            emit('update:modelValue', [...modelValue])
          }
        }),
    ...(rules ? { onChange: () => void validateCell(rowData, key, rules) } : {})
  }
}

/**
 * 表头渲染：required 列表头追加红星；该列存在未通过项时文字标红并追加
 * 感叹号图标，悬停经 UTip 气泡展示各行错误明细；用户声明了 `#header:key`
 * 插槽时以插槽内容替代列名。
 * 渲染函数内读取 columnErrors 建立响应依赖，错误出现/消失即时更新表头。
 */
function renderHeader(column: TableEditorColumn, ctx: { column: TableColumnNode }) {
  const messages = columnErrors.value.get(column.key)
  const nodes = [
    h(
      'span',
      { class: [cls.e('header-text'), bem.is('error', !!messages?.length)] },
      slots[`header:${column.key}`]?.(ctx) ?? column.name
    )
  ]

  if (column.rules?.required) {
    nodes.unshift(h('span', { class: cls.e('required-mark'), 'aria-hidden': 'true' }, '*'))
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
  if (cell) focusEditableCell(cell)
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
