import type { QueryParamDef } from './dataset-hub'

/** 按绑定的数据集 id 合并查询参数（同名参数先见为准） */
export function resolveBoundDatasetParams(
  queryParams: QueryParamDef[],
  boundDatasetIds: readonly string[],
  getDatasetParams: (datasetId: string) => QueryParamDef[]
): QueryParamDef[] {
  const map = new Map<string, QueryParamDef>()
  for (const datasetId of boundDatasetIds) {
    const params = getDatasetParams(datasetId)
    for (const param of params) {
      if (!map.has(param.id)) map.set(param.id, param)
    }
  }
  if (map.size > 0) return Array.from(map.values())
  return queryParams
}

/** @deprecated 使用 resolveBoundDatasetParams */
export function resolveVisibleParams(
  queryParams: QueryParamDef[],
  activeDatasetIds: readonly string[]
): QueryParamDef[] {
  const datasetSet = new Set(activeDatasetIds)
  return queryParams.filter((param) => {
    const appliesTo = (param as { appliesTo?: string[] }).appliesTo
    if (!appliesTo || appliesTo.length === 0) return true
    return appliesTo.some((id) => datasetSet.has(id))
  })
}
