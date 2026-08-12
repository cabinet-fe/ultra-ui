/** 设计器吐出的 Report Template JSON（网格绑定 + 内嵌数据集定义） */
export type StoredReportTemplate = Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 校验 ReportTemplate 快照形状；非法返回 null，缺省返回 undefined */
export function validateStoredTemplate(input: unknown): StoredReportTemplate | null | undefined {
  if (input === undefined || input === null) return undefined
  if (!isRecord(input)) return null
  if (typeof input.rows !== 'number' || typeof input.cols !== 'number') return null
  if (!Array.isArray(input.cells)) return null
  if (input.version !== undefined && typeof input.version !== 'number') return null
  if (input.datasets !== undefined && !Array.isArray(input.datasets)) return null
  if (input.colWidths !== undefined && !Array.isArray(input.colWidths)) return null
  return input
}
