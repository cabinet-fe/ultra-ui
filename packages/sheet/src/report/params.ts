import type { QueryParamDef, QueryParamType } from './types'

/** 从 SQL 提取 `${param}` 占位符 id（ADR-0002 决策 2：前端纯函数） */
export function extractParamIds(sql: string): string[] {
  const ids: string[] = []
  const re = /\$\{([^}]+)\}/g
  let match: RegExpExecArray | null
  while ((match = re.exec(sql)) !== null) {
    const id = match[1]!.trim()
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 从 SQL 上下文推断参数控件类型（BETWEEN/LIKE/数值比较） */
function inferParamTypeFromSql(sql: string, paramId: string): QueryParamType {
  const betweenSingle = new RegExp(
    `\\bBETWEEN\\s+\\$\\{${escapeRegExp(paramId)}\\}(?!\\s+AND)`,
    'i'
  )
  if (betweenSingle.test(sql)) return 'date-range'

  const betweenPair = new RegExp(
    `\\bBETWEEN\\s+\\$\\{${escapeRegExp(paramId)}\\}\\s+AND\\s+\\$\\{([^}]+)\\}`,
    'i'
  )
  const pairMatch = betweenPair.exec(sql)
  if (pairMatch && pairMatch[1]!.trim() !== paramId) return 'date'

  const like = new RegExp(`\\bLIKE\\s+\\$\\{${escapeRegExp(paramId)}\\}`, 'i')
  if (like.test(sql)) return 'text'

  const numericCompare = new RegExp(
    `[<>=]+\\s+\\$\\{${escapeRegExp(paramId)}\\}|\\$\\{${escapeRegExp(paramId)}\\}\\s*[<>=]+`,
    'i'
  )
  if (numericCompare.test(sql)) return 'number'

  return 'text'
}

function defaultValueForType(type: QueryParamType): unknown {
  switch (type) {
    case 'number':
      return 0
    case 'date-range':
      return ['', '']
    case 'select':
      return ''
    default:
      return ''
  }
}

/**
 * 从 SQL 构建查询参数定义：提取 `${param}` 占位符 + 上下文类型推断，
 * 再叠加数据集编辑器的元数据覆盖（label / 类型 / 默认值 / 选项）。
 */
export function buildParamDefs(
  sql: string,
  overrides?: Record<string, Partial<Omit<QueryParamDef, 'id'>>>
): QueryParamDef[] {
  const ids = extractParamIds(sql)
  return ids.map((id) => {
    const inferred = inferParamTypeFromSql(sql, id)
    const override = overrides?.[id]
    return {
      id,
      label: override?.label ?? id,
      type: override?.type ?? inferred,
      defaultValue: override?.defaultValue ?? defaultValueForType(override?.type ?? inferred),
      options: override?.options
    }
  })
}

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
