/**
 * 与历史 cat-kit `Tree.dft` 一致：回调返回 `false` 时不再深入该节点的子树，但不中断兄弟分支。
 * `@cat-kit/core` 的 `dfs` 在返回 `true` 时会终止整棵树的遍历，语义不同，故单独实现。
 */
export function treeDftPrune(
  data: any,
  cb: (node: any) => void | false,
  childrenKey = 'children'
): void {
  if (cb(data) === false) return
  const raw = data[childrenKey]
  if (!Array.isArray(raw)) return
  for (let i = 0; i < raw.length; i++) {
    treeDftPrune(raw[i], cb, childrenKey)
  }
}

export function forestRootsDftPrune(
  roots: readonly unknown[],
  cb: (node: any) => void | false,
  childrenKey = 'children'
): void {
  for (const r of roots) {
    treeDftPrune(r, cb, childrenKey)
  }
}

/** 与 cat-kit `Tree.dftWithPath` 一致 */
export function treeDftWithPath<T extends Record<string, unknown>>(
  data: T,
  cb: (node: T, path: T[]) => void | false,
  childrenKey = 'children',
  nodePath: T[] = []
): void {
  const path = [...nodePath, data]
  if (cb(data, path) === false) return
  const raw = data[childrenKey]
  if (!Array.isArray(raw)) return
  for (let i = 0; i < raw.length; i++) {
    treeDftWithPath(raw[i] as T, cb, childrenKey, path)
  }
}

/** 等价于历史 `Forest.visit(roots, indexPath, childrenKey)`（操作原始数据数组路径） */
export function visitDataTreeByPath<T extends Record<string, unknown>>(
  roots: T[],
  indexPath: number[],
  childrenKey: string
): T | undefined {
  if (!indexPath.length) return undefined
  let currentList: T[] | undefined = roots
  let node: T | undefined
  for (let i = 0; i < indexPath.length; i++) {
    const idx = indexPath[i]!
    if (!currentList) return undefined
    node = currentList[idx]
    if (node === undefined) return undefined
    if (i < indexPath.length - 1) {
      const next = node[childrenKey]
      currentList = Array.isArray(next) ? (next as T[]) : undefined
    }
  }
  return node
}
