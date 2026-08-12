import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'

import { getDb } from './db'
import type { StoredReportTemplate } from './template-validation'

export interface ReportTemplateSummary {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface ReportTemplateRecord extends ReportTemplateSummary {
  template: StoredReportTemplate
}

function selectAll(database: DatabaseSync, sql: string): Record<string, unknown>[] {
  return database.prepare(sql).all() as Record<string, unknown>[]
}

function rowToSummary(row: Record<string, unknown>): ReportTemplateSummary {
  return {
    id: String(row.id),
    name: String(row.name),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  }
}

function parseTemplateJson(raw: string): StoredReportTemplate | undefined {
  try {
    return JSON.parse(raw) as StoredReportTemplate
  } catch {
    return undefined
  }
}

/** 列出全部报表模板（不含 template 正文） */
export function listReportTemplates(): ReportTemplateSummary[] {
  const database = getDb()
  return selectAll(
    database,
    'SELECT id, name, created_at, updated_at FROM report_templates ORDER BY updated_at DESC'
  ).map(rowToSummary)
}

/** 按 id 读取报表模板 */
export function getReportTemplate(id: string): ReportTemplateRecord | undefined {
  const database = getDb()
  const row = database
    .prepare(
      'SELECT id, name, template_json, created_at, updated_at FROM report_templates WHERE id = ?'
    )
    .get(id) as Record<string, unknown> | undefined
  if (!row) return undefined
  const template = parseTemplateJson(String(row.template_json))
  if (!template) return undefined
  return { ...rowToSummary(row), template }
}

/** 新建报表模板 */
export function createReportTemplate(
  name: string,
  template: StoredReportTemplate
): ReportTemplateRecord {
  const database = getDb()
  const id = randomUUID()
  database
    .prepare(
      `
    INSERT INTO report_templates (id, name, template_json, created_at, updated_at)
    VALUES ($id, $name, $template_json, datetime('now'), datetime('now'))
  `
    )
    .run({ id, name, template_json: JSON.stringify(template) })
  const record = getReportTemplate(id)
  if (!record) throw new Error('创建报表模板后读取失败')
  return record
}

/** 更新报表模板（名称与/或正文） */
export function updateReportTemplate(
  id: string,
  patch: { name?: string; template?: StoredReportTemplate }
): ReportTemplateRecord | undefined {
  const current = getReportTemplate(id)
  if (!current) return undefined

  const nextName = patch.name ?? current.name
  const nextTemplate = patch.template ?? current.template
  const database = getDb()
  database
    .prepare(
      `
    UPDATE report_templates
    SET name = $name, template_json = $template_json, updated_at = datetime('now')
    WHERE id = $id
  `
    )
    .run({ id, name: nextName, template_json: JSON.stringify(nextTemplate) })
  return getReportTemplate(id)
}

/** 删除报表模板 */
export function deleteReportTemplate(id: string): boolean {
  const database = getDb()
  const result = database.prepare('DELETE FROM report_templates WHERE id = ?').run(id)
  return result.changes > 0
}
