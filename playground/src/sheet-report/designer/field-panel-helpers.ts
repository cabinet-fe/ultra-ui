import type { DatasetCatalogItem, DatasetField } from '@veltra/sheet'

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
