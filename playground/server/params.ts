import type { ConnectorError, DatasetField, ParamValues } from '@veltra/sheet'

import { ERROR_CODES } from './errors'

/**
 * SQL 中的 `${param}` 占位符。
 * 与前端参数提取（@veltra/sheet report/params）保持一致：参数名为 `\w+`。
 */
export const PARAM_PATTERN = /\$\{(\w+)\}/g

/** 按首次出现顺序提取 SQL 引用的参数名（去重） */
export function extractParams(sql: string): string[] {
  const names: string[] = []
  for (const match of sql.matchAll(PARAM_PATTERN)) {
    const name = match[1]
    if (name !== undefined && !names.includes(name)) names.push(name)
  }
  return names
}

/**
 * 校验 SQL 引用的每个参数都在 values 中提供了值（`undefined` 视为缺失）。
 * 缺失返回业务错误（MISSING_PARAM，200 透传）；连接器调用前先校验，避免无谓建连。
 */
export function checkParams(
  sql: string,
  values: ParamValues
): { ok: true } | { ok: false; error: ConnectorError } {
  const missing = extractParams(sql).filter(
    (name) => !(name in values) || values[name] === undefined
  )
  if (missing.length > 0) {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.MISSING_PARAM,
        message: `SQL 引用了参数 ${missing.map((name) => `\${${name}}`).join('、')}，但请求 values 未提供对应值`
      }
    }
  }
  return { ok: true }
}

/** 检测 SQL 是否以 CTE（WITH）开头（忽略前导空白与分号） */
export function hasLeadingCte(sql: string): boolean {
  const trimmed = sql.trim().replace(/;+\s*$/, '')
  return /^\s*WITH\b/i.test(trimmed)
}

/** MySQL describe 遇到 CTE 时的可读业务错误（派生表不支持 WITH） */
export function describeCteUnsupportedError(): ConnectorError {
  return {
    code: ERROR_CODES.SQL_ERROR,
    message:
      'MySQL 下 describe 不支持 CTE（WITH 子句）：请将 CTE 改写为子查询后再 describe，或改用 query 取数'
  }
}

/**
 * describe 专用 SQL：占位符以 NULL 替换（describe 不携带参数值），
 * 再包装为 `LIMIT 0` 派生表——只取字段元数据、不取数。
 * 已知边界：MySQL 8 派生表不支持 CTE（WITH）语法，含 CTE 的 SQL 在 MySQL describe 路径会提前返回可读错误。
 */
export function toDescribeSql(sql: string): string {
  const trimmed = sql.trim().replace(/;+\s*$/, '')
  const withoutParams = trimmed.replace(PARAM_PATTERN, 'NULL')
  return `SELECT * FROM (${withoutParams}) AS __report_describe LIMIT 0`
}

/** 数值字段的驱动值（DECIMAL / NUMERIC 返回字符串）规整为 number，保证契约 `type: 'number'` 字段值也为 number */
export function coerceNumericRows(
  fields: DatasetField[],
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  const numberFields = new Set(
    fields.filter((field) => field.type === 'number').map((field) => field.name)
  )
  if (numberFields.size === 0) return rows
  return rows.map((row) => {
    const next = { ...row }
    for (const name of numberFields) {
      const value = next[name]
      if (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value))) {
        const num = Number(value)
        // 防溢出：'1e999' 这类字符串会得到 Infinity，JSON 序列化会变成 null
        if (Number.isFinite(num)) next[name] = num
      }
    }
    return next
  })
}
