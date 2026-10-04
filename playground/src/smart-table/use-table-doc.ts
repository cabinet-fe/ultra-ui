import { message } from '@veltra/desktop'
import { onScopeDispose, ref, watch } from 'vue'

import {
  isOptionsField,
  type CellValue,
  type FieldType,
  type TableDoc,
  type TableField
} from './types'

/** 演示表存取端点（vite proxy `/smart-table-api` → 参考服务 `/smart-table`） */
const TABLE_API = '/smart-table-api/table'
/** 数据变更后的防抖保存间隔（毫秒） */
const SAVE_DEBOUNCE_MS = 600

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

/** 列设置写回补丁：只带要改的属性（options 仅单选/多选有意义） */
export interface FieldPatch {
  name?: string
  type?: FieldType
  options?: string[]
}

/**
 * 既有单元格值按字段当前类型 / 选项收拢：兼容的直接转换（数字 ↔ 文本、
 * 单选 ↔ 多选包装等），不兼容的清空为 null，保证 PUT 契约始终通过。
 */
function coerceCellValue(value: CellValue, field: TableField): CellValue {
  if (value == null) return null
  switch (field.type) {
    case 'text':
      return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : null
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? value : null
    case 'progress': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return null
      return Math.min(100, Math.max(0, value))
    }
    case 'date':
      return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
    case 'checkbox':
      return typeof value === 'boolean' ? value : null
    case 'select': {
      const candidates = Array.isArray(value) ? value : [value]
      const hit = candidates.find(
        (item) => typeof item === 'string' && field.options?.includes(item)
      )
      return hit ?? null
    }
    case 'multi-select': {
      const items = (
        Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
      ).filter((item) => typeof item === 'string' && field.options?.includes(item))
      return items.length > 0 ? Array.from(new Set(items)) : null
    }
    case 'member':
    case 'image': {
      const items = (
        Array.isArray(value)
          ? value
          : typeof value === 'string' && value.trim() !== ''
            ? [value]
            : []
      ).filter((item) => typeof item === 'string' && item.trim() !== '')
      return items.length > 0 ? items : null
    }
  }
}

/** 参考服务 `/smart-table/table` 的响应形状 */
interface TableApiResponse {
  ok: boolean
  doc?: TableDoc
  error?: { message?: string }
}

/**
 * 演示表文档状态：onMounted 拉取 GET 全量文档，之后任何深层改动都经防抖整表
 * PUT 持久化，刷新页面数据保留。与 `use-smart-sheet` 共用同一份 `doc`：网格
 * 编辑经 cell-change 回写 doc，行/字段增删由 doc 驱动网格重装配，两条通路
 * 汇入本处防抖保存（`pagehide` 冲刷兜底）。
 */
export function useTableDoc() {
  const doc = ref<TableDoc | null>(null)
  const saveState = ref<SaveState>('saved')

  let saveTimer: ReturnType<typeof setTimeout> | undefined
  /** 初次加载的整表赋值不触发一次多余的保存 */
  let skipNextChange = false

  watch(
    doc,
    () => {
      if (skipNextChange) {
        skipNextChange = false
        return
      }
      saveState.value = 'dirty'
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => void saveNow(), SAVE_DEBOUNCE_MS)
    },
    { deep: true }
  )

  async function load(): Promise<void> {
    try {
      const res = await fetch(TABLE_API)
      const data = (await res.json()) as TableApiResponse
      if (!res.ok || !data.ok || !data.doc) {
        throw new Error(data.error?.message ?? `加载演示表失败（HTTP ${res.status}）`)
      }
      skipNextChange = true
      doc.value = data.doc
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : '加载演示表失败')
    }
  }

  /** keepalive 保证刷新/关闭页面时未落盘的防抖变更也能发出请求 */
  async function saveNow(keepalive = false): Promise<void> {
    const snapshot = doc.value
    if (!snapshot) return
    saveState.value = 'saving'
    try {
      const res = await fetch(TABLE_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
        keepalive
      })
      const data = (await res.json()) as TableApiResponse
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message ?? `保存演示表失败（HTTP ${res.status}）`)
      }
      saveState.value = 'saved'
    } catch (reason) {
      saveState.value = 'error'
      message.error(reason instanceof Error ? reason.message : '保存演示表失败')
    }
  }

  /** 页面隐藏/刷新前冲刷挂起的防抖保存（配合 keepalive） */
  function flushPendingSave(): void {
    if (saveTimer === undefined) return
    clearTimeout(saveTimer)
    saveTimer = undefined
    void saveNow(true)
  }

  document.addEventListener('pagehide', flushPendingSave)
  onScopeDispose(() => {
    document.removeEventListener('pagehide', flushPendingSave)
    clearTimeout(saveTimer)
  })

  /** 以 `r1`/`r2`… 顺延生成不与现有 id 冲突的新 id */
  function nextId(prefix: string, existing: string[]): string {
    const used = new Set(existing)
    let n = existing.length + 1
    while (used.has(`${prefix}${n}`)) n++
    return `${prefix}${n}`
  }

  /** 追加一个空行（单元格缺键即空值；网格侧重装配时自动选中末行首格） */
  function addRow(): void {
    if (!doc.value) return
    doc.value.rows.push({
      id: nextId(
        'r',
        doc.value.rows.map((r) => r.id)
      ),
      values: {}
    })
  }

  function removeRow(rowId: string): void {
    if (!doc.value) return
    doc.value.rows = doc.value.rows.filter((row) => row.id !== rowId)
  }

  function addField(input: {
    name: string
    type: FieldType
    options?: string[]
  }): TableField | null {
    if (!doc.value) return null
    const field: TableField = {
      id: nextId(
        'f',
        doc.value.fields.map((f) => f.id)
      ),
      name: input.name,
      type: input.type
    }
    if (isOptionsField(input.type)) field.options = input.options
    doc.value.fields.push(field)
    return field
  }

  /** 列设置写回：改名 / 改类型 / 选项管理；类型或选项变化后既有值按新契约清洗 */
  function updateField(fieldId: string, patch: FieldPatch): void {
    const table = doc.value
    const field = table?.fields.find((item) => item.id === fieldId)
    if (!table || !field) return
    if (patch.name !== undefined) field.name = patch.name
    if (patch.type !== undefined) field.type = patch.type
    if (isOptionsField(field.type)) {
      if (patch.options !== undefined) field.options = patch.options
    } else {
      delete field.options
    }
    for (const row of table.rows) {
      if (fieldId in row.values) row.values[fieldId] = coerceCellValue(row.values[fieldId]!, field)
    }
  }

  /** 删除整列并清掉各行该字段的值；至少保留一个字段（服务端要求 fields 非空） */
  function removeField(fieldId: string): void {
    if (!doc.value) return
    if (doc.value.fields.length <= 1) {
      message.info('演示表至少保留一个字段')
      return
    }
    doc.value.fields = doc.value.fields.filter((field) => field.id !== fieldId)
    for (const row of doc.value.rows) delete row.values[fieldId]
  }

  return { doc, saveState, load, addRow, removeRow, addField, updateField, removeField }
}
