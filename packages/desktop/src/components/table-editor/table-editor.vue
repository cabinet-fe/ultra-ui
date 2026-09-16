<template>
  <u-table
    v-bind="tableProps"
    :columns="internalColumns"
    :data="modelValue"
    :class="cls.b"
    :stripe="false"
    show-index
  >
    <!-- 其余插槽（header:* / row:expand / foot / append 等）透传给 u-table；column:* 与 empty 由组件接管 -->
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
          v-if="!props.readonly"
          text
          size="small"
          type="primary"
          :icon="Plus"
          @click="handleCreate()"
        >
          添加
        </u-button>
      </div>
    </template>
  </u-table>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { Copy, Minus, Plus, Warning } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, h, shallowRef, toRaw, triggerRef, useSlots, watch } from 'vue'

import type {
  TableEditorProps,
  TableEditorEmits,
  TableEditorColumn,
  _TableEditorExposed,
  TableColumn,
  TableColumnNode,
  TableColumnRenderContext,
  TableColumnSlotsScope,
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

const props = defineProps<TableEditorProps>()
const emit = defineEmits<TableEditorEmits>()

const columns = computed(() => props.columns ?? [])
const modelValue = computed(() => props.modelValue ?? [])

/** 转发给 u-table 的表格属性；columns / modelValue / readonly 为编辑器自用，stripe / showIndex 被覆盖 */
const tableProps = computed(() => {
  const rest: Record<string, any> = { ...props }
  delete rest.columns
  delete rest.modelValue
  delete rest.readonly
  return rest
})

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
 * 内部列定义：单元格渲染挂在列的 render 上（用户列自带的 render 优先），
 * 配置了 rules 的列包装 nameRender 追加校验标识，非只读时末尾追加操作列。
 * 列 key 带上只读态后缀：u-table 行内单元格在 props 值相等时可能跳过子组件补丁，
 * 只读切换改用挂载键直接重挂单元格，确保控件在编辑/只读形态间可靠切换。
 */
const internalColumns = computed<TableColumn[]>(() => {
  const list = columns.value.map((column) => ({
    ...column,
    key: `${column.key}${props.readonly ? ':ro' : ''}`,
    nameRender: column.rules ? headerCell(column) : column.nameRender,
    render: column.render ?? ((ctx: TableColumnRenderContext) => editCell(column, ctx))
  }))
  return props.readonly ? list : [...list, actionColumn]
})

/** 透传给 u-table 的插槽名：column:* 经 editCell 注入 model、empty 由组件接管，其余透传 */
const passSlotNames = Object.keys(slots).filter(
  (name) => !name.startsWith('column:') && name !== 'empty'
)

/**
 * 带校验的列表头包装：required 时列名前渲染红星；该列存在未通过项时文字标红并追加
 * 感叹号图标，悬停经 UTip 气泡展示各行错误明细；`#header:key` 插槽 / nameRender 内容替代列名。
 * 渲染函数内读取 columnErrors 建立响应依赖，错误出现/消失即时更新表头。
 */
function headerCell(column: TableEditorColumn) {
  return (ctx: { column: TableColumnNode }): RenderReturn => {
    const messages = columnErrors.value.get(column.key)
    const nodes = [
      h(
        'span',
        { class: [cls.e('header-text'), bem.is('error', !!messages?.length)] },
        slots[`header:${column.key}`]?.(ctx) ?? column.nameRender?.(ctx) ?? column.name
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
    // 行错误清空后移除条目，保证「size > 0 即存在错误」可作整体判定
    if (!rowErrors.size) cellErrors.value.delete(row)
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
  if (!modelValue.value.some((item) => errorRowKey(item) === row)) return

  setCellError(row, key, message)
}

/**
 * 整表校验：并行校验所有行的规则列（不懒校验），未通过的单元格全部标出。
 * 全部通过 resolve true，否则 resolve false。
 */
async function validate() {
  const ruleColumns = columns.value.filter((column) => column.rules)

  await Promise.all(
    modelValue.value.map((row) =>
      Promise.all(ruleColumns.map((column) => validateCell(row, column.key, column.rules)))
    )
  )

  return cellErrors.value.size === 0
}

// 行删除（或整体替换）后，同步清理已不存在的行数据上的错误
watch(modelValue, (rows) => {
  if (!cellErrors.value.size) return

  const aliveRows = new Set(rows.map(errorRowKey))
  const next = new Map<Record<string, any>, Map<string, string>>()
  let changed = false

  for (const [row, errors] of cellErrors.value) {
    if (aliveRows.has(row)) next.set(row, errors)
    else changed = true
  }

  if (changed) cellErrors.value = next
})

/** 列 key → 该列全部未通过信息（带行序号），驱动表头错误标识 */
const columnErrors = computed(() => {
  const map = new Map<string, string[]>()
  if (!cellErrors.value.size) return map

  for (const [row, errors] of cellErrors.value) {
    const index = modelValue.value.findIndex((item) => errorRowKey(item) === row)
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

/**
 * 声明了 `#column:key` 插槽的列调用编辑插槽（注入 model），未声明的渲染字段原始值。
 * 配置了 rules 的列在渲染期间读取 cellErrors 建立依赖，错误出现/消失即时更新：
 * 插槽内容常驻包一层容器、仅切换 is-error 类（与表单项错误态同类，不增删 DOM，
 * 控件不因错误态变化重挂丢焦点）；纯文本列仅在出错时包一层标红原始值。
 */
function editCell(column: TableEditorColumn, ctx: TableColumnRenderContext): RenderReturn {
  const editSlot = slots[`column:${column.key}`]
  // 内部列 key 带只读态后缀，u-table 按 key 取到的 val 失效，这里按原始列 key 重取
  const val = o(ctx.rowData).get(column.key)

  if (!column.rules) {
    if (!editSlot) return val
    const scope = { ...ctx, val }
    return editSlot({ ...scope, model: createCellModel(column, scope) })
  }

  const hasError = !!cellErrors.value.get(errorRowKey(ctx.rowData))?.has(column.key)
  if (!editSlot) return hasError ? h('span', { class: bem.is('error') }, val) : val

  const scope = { ...ctx, val }
  return h(
    'span',
    { class: bem.is('error', hasError) },
    editSlot({ ...scope, model: createCellModel(column, scope) })
  )
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
    ...(props.readonly
      ? { readonly: true }
      : {
          'onUpdate:modelValue': (value: any) => {
            rowData[key] = value
            emit('update:modelValue', [...modelValue.value])
          }
        }),
    ...(rules ? { onChange: () => void validateCell(rowData, key, rules) } : {})
  }
}

function handleCreate(index?: number) {
  const at = index !== undefined ? index + 1 : modelValue.value.length
  emit('update:modelValue', [...modelValue.value.slice(0, at), {}, ...modelValue.value.slice(at)])
}

function handleCopy(row: TableRowNode) {
  emit('update:modelValue', [
    ...modelValue.value.slice(0, row.index + 1),
    JSON.parse(JSON.stringify(row.data)),
    ...modelValue.value.slice(row.index + 1)
  ])
}

function handleDelete(index: number) {
  emit(
    'update:modelValue',
    modelValue.value.filter((_, i) => i !== index)
  )
}

defineExpose<_TableEditorExposed>({ validate })
</script>
