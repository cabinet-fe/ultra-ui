import type { DatasetQueryParam } from './dataset-hub'

/** 按当前模板关联的数据集筛选可见查询参数 */
export function resolveVisibleParams(
  queryParams: DatasetQueryParam[],
  activeDatasetIds: readonly string[]
): DatasetQueryParam[] {
  const datasetSet = new Set(activeDatasetIds)
  return queryParams.filter((param) => {
    if (!param.appliesTo || param.appliesTo.length === 0) return true
    return param.appliesTo.some((id) => datasetSet.has(id))
  })
}
