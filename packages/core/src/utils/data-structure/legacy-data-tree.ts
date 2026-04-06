import { o } from '@cat-kit/core'

/**
 * 在「纯数据」树上 DFS（旧版 Tree.dft）。
 * 回调返回 `false` 时不遍历子节点。
 */
export function dataTreeDft<Data extends Record<string, any>>(
  root: Data,
  cb: (node: Data) => void | false,
  childrenKey = 'children'
): void {
  function walk(data: Data): void {
    const ret = cb(data)
    if (ret === false) return
    const children = o(data).get(childrenKey)
    if (!Array.isArray(children)) return
    for (const child of children) walk(child as Data)
  }
  walk(root)
}

/**
 * 带路径的 DFS（旧版 Tree.dftWithPath）。
 * `path` 为从根到当前节点的数据对象序列（含当前节点）。
 */
export function dataTreeDftWithPath<Data extends Record<string, any>>(
  root: Data,
  cb: (node: Data, path: Data[]) => void | false,
  childrenKey = 'children'
): void {
  function walk(data: Data, path: Data[]): void {
    const ret = cb(data, path)
    if (ret === false) return
    const children = o(data).get(childrenKey)
    if (!Array.isArray(children)) return
    for (const child of children) walk(child as Data, [...path, child as Data])
  }
  walk(root, [root])
}

/** 命名空间风格，便于 `Tree.dft` 迁移 */
export const LegacyDataTree = {
  dft: dataTreeDft,
  dftWithPath: dataTreeDftWithPath
} as const
