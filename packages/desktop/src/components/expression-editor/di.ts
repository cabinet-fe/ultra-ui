import type { VariableItem } from '../../types'

/** 扁平化变量树，创建 value -> VariableItem 的映射，用于 DOM → 模型反推时补齐 label/type。 */
export function createVariableMap(variables?: VariableItem[]): Map<string, VariableItem> {
  const map = new Map<string, VariableItem>()
  function traverse(items: VariableItem[] | undefined) {
    if (!items) return
    for (const item of items) {
      map.set(item.value, item)
      if (item.children) traverse(item.children)
    }
  }
  traverse(variables)
  return map
}
