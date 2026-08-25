/**
 * playground 参考服务：在线填报单元格存取 + DeepSeek `/ai` 挂载点。
 * 报表 DataConnector 已迁出本仓库，本进程不再提供 test/describe/query。
 */
import { Hono } from 'hono'
import type { Context } from 'hono'
import { logger } from 'hono/logger'

import { listDataEntryCells, saveDataEntryCells, type DataEntryCell } from './data-entry'
import { ERROR_CODES, type ConnectorError } from './errors'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalid(message: string): ConnectorError {
  return { code: ERROR_CODES.INVALID_REQUEST, message }
}

/** 解析并校验 JSON 请求体；形状不合法已回 400 */
async function readJsonBody(
  c: Context
): Promise<{ ok: true; value: Record<string, unknown> } | { ok: false; response: Response }> {
  let parsed: unknown
  try {
    parsed = await c.req.json()
  } catch {
    return { ok: false, response: c.json({ ok: false, error: invalid('请求体必须是 JSON') }, 400) }
  }
  if (!isRecord(parsed)) {
    return {
      ok: false,
      response: c.json({ ok: false, error: invalid('请求体必须是 JSON 对象') }, 400)
    }
  }
  return { ok: true, value: parsed }
}

/** 填报表单 id 校验（路径参数） */
function validateFormId(input: string): string | null {
  const formId = input.trim()
  if (!formId || formId.length > 128) return null
  return formId
}

/** 在线填报演示单批上限（填报单次保存通常只有零星几格） */
const MAX_DATA_ENTRY_CELLS = 10_000

/** 校验填报单元格数组：sheet 1~128 字符；row/col 非负整数；value 仅 JSON 标量（null/'' = 删除该格） */
function validateDataEntryCells(
  input: unknown
): { ok: true; value: DataEntryCell[] } | { ok: false; error: ConnectorError } {
  if (!Array.isArray(input)) return { ok: false, error: invalid('cells 必须是数组') }
  if (input.length > MAX_DATA_ENTRY_CELLS) {
    return { ok: false, error: invalid(`cells 一次最多 ${MAX_DATA_ENTRY_CELLS} 条`) }
  }
  const cells: DataEntryCell[] = []
  for (const item of input) {
    if (!isRecord(item)) return { ok: false, error: invalid('cell 必须是 JSON 对象') }
    const { sheet, row, col, value } = item
    if (typeof sheet !== 'string' || sheet.trim() === '' || sheet.length > 128) {
      return { ok: false, error: invalid('cell.sheet 必须是 1~128 字符') }
    }
    if (!Number.isInteger(row) || (row as number) < 0) {
      return { ok: false, error: invalid('cell.row 必须是非负整数') }
    }
    if (!Number.isInteger(col) || (col as number) < 0) {
      return { ok: false, error: invalid('cell.col 必须是非负整数') }
    }
    if (
      value !== null &&
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      return { ok: false, error: invalid('cell.value 只支持 string / number / boolean / null') }
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return { ok: false, error: invalid('cell.value 必须是有限数字') }
    }
    cells.push({ sheet, row: row as number, col: col as number, value })
  }
  return { ok: true, value: cells }
}

export const playgroundApp = new Hono()

playgroundApp.use(logger())

playgroundApp.get('/', (c) =>
  c.json({
    name: 'playground 参考服务（dev-only，不进发布产物）',
    endpoints: {
      dataEntryGet: { method: 'GET', path: '/data-entry/forms/:formId/cells' },
      dataEntryPut: { method: 'PUT', path: '/data-entry/forms/:formId/cells' },
      ai: { path: '/ai' }
    }
  })
)

/** GET /data-entry/forms/:formId/cells — 读取表单全部已存单元格（在线填报演示） */
playgroundApp.get('/data-entry/forms/:formId/cells', (c) => {
  const formId = validateFormId(c.req.param('formId'))
  if (!formId) {
    return c.json({ ok: false, error: invalid('formId 必须是 1~128 字符') }, 400)
  }
  return c.json({ ok: true, cells: listDataEntryCells(formId) })
})

/** PUT /data-entry/forms/:formId/cells — 按单元格批量 upsert（空值删除该格记录） */
playgroundApp.put('/data-entry/forms/:formId/cells', async (c) => {
  const formId = validateFormId(c.req.param('formId'))
  if (!formId) {
    return c.json({ ok: false, error: invalid('formId 必须是 1~128 字符') }, 400)
  }
  const body = await readJsonBody(c)
  if (!body.ok) return body.response
  const cells = validateDataEntryCells(body.value.cells)
  if (!cells.ok) return c.json({ ok: false, error: cells.error }, 400)
  return c.json({ ok: true, saved: saveDataEntryCells(formId, cells.value) })
})
