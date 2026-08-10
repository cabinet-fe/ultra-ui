import type { DatasetCatalogItem, DatasetField } from '../../report/types'

/** 字段拖拽的 dataTransfer MIME（字段面板 dragstart / 网格 drop 共用） */
export const FIELD_DRAG_MIME = 'application/x-sheet-report-field'

/** 字段拖拽负载：`${datasetId}:${fieldName}` */
export function formatFieldDragPayload(datasetId: string, fieldName: string): string {
  return `${datasetId}:${fieldName}`
}

/** 解析字段拖拽负载；非法输入返回 null */
export function parseFieldDragPayload(
  raw: string
): { datasetId: string; fieldName: string } | null {
  const sep = raw.indexOf(':')
  if (sep <= 0) return null
  const fieldName = raw.slice(sep + 1)
  if (!fieldName) return null
  return { datasetId: raw.slice(0, sep), fieldName }
}

export function fieldTypeGlyph(type: DatasetField['type']): string {
  if (type === 'number') return '#'
  if (type === 'date') return '日'
  return '文'
}

export function filterDatasetsByQuery(
  datasets: DatasetCatalogItem[],
  query: string
): DatasetCatalogItem[] {
  const keyword = query.trim().toLowerCase()
  if (!keyword) return datasets

  return datasets
    .map((dataset) => ({
      ...dataset,
      fields: dataset.fields.filter(
        (field) =>
          field.label.toLowerCase().includes(keyword) || field.name.toLowerCase().includes(keyword)
      )
    }))
    .filter((dataset) => dataset.fields.length > 0)
}
