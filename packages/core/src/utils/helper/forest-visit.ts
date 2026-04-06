/** 兼容旧版 cat-kit Forest.visit：按索引路径在树形数据中定位节点 */
export function forestVisit(
  nodes: Record<string, any>[],
  indexPath: number[],
  childrenKey = 'children'
): Record<string, any> | undefined {
  let list = nodes
  for (let d = 0; d < indexPath.length; d++) {
    const idx = indexPath[d]!
    const node = list[idx]
    if (node == null) return undefined
    if (d === indexPath.length - 1) return node
    list = node[childrenKey] ?? []
  }
  return undefined
}
