import { message } from '@veltra/desktop'
import { onScopeDispose, ref, watch } from 'vue'

import { isOptionsField, type FieldType, type TableDoc, type TableField } from './types'

/** 演示表存取端点（vite proxy `/smart-table-api` → 参考服务 `/smart-table`） */
const TABLE_API = '/smart-table-api/table'
/** 数据变更后的防抖保存间隔（毫秒） */
const SAVE_DEBOUNCE_MS = 600

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

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

  return { doc, saveState, load, addRow, removeRow, addField, removeField }
}
