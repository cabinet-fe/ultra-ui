/**
 * 深度优先 + 路径；回调返回 `false` 时剪枝当前节点子树（不中断兄弟）。
 * `@cat-kit/core` 的 `dfs` 在返回 `true` 时会终止整段遍历，语义不同，故保留此辅助。
 */
export function walkNavWithPath<T extends Record<string, unknown>>(
  data: T,
  cb: (node: T, path: T[]) => void | false,
  childrenKey = 'children',
  prefix: T[] = []
): void {
  const path = [...prefix, data]
  if (cb(data, path) === false) return
  const raw = data[childrenKey]
  if (!Array.isArray(raw)) return
  for (let i = 0; i < raw.length; i++) {
    walkNavWithPath(raw[i] as T, cb, childrenKey, path)
  }
}
