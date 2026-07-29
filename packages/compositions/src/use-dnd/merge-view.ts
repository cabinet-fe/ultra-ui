/**
 * 将“拖拽视图”的新顺序稳定合并回完整数组。
 *
 * 视图是完整数组中参与拖拽排序的项（`filter` 命中的项），与 DOM 中可拖拽节点一一对应。
 * 合并规则：
 * - 未参与拖拽的项保持相对顺序（锚定在其前驱可见项之后）
 * - 旧视图成员按新视图顺序重排（排序）
 * - 新视图中缺少的旧成员被移除（跨容器移出）
 * - 新视图中多出的成员按相对位置插入（跨容器移入）
 *
 * @param source 完整数组
 * @param prevView 排序前的视图
 * @param nextView 排序/转移后的视图
 * @returns 合并后的新数组（不修改入参）
 */
export function mergeView<T>(
  source: readonly T[],
  prevView: readonly T[],
  nextView: readonly T[]
): T[] {
  const prevSet = new Set(prevView)
  const nextSet = new Set(nextView)
  const placed = new Set<T>()
  const queue = [...nextView]
  const result: T[] = []

  for (const item of source) {
    // 未参与拖拽的项原位保留
    if (!prevSet.has(item)) {
      result.push(item)
      continue
    }
    // 已从新视图移除（跨容器移出），或已按新顺序放置过
    if (!nextSet.has(item) || placed.has(item)) continue
    // 先放出新视图中排在它前面的项（含跨容器移入的新成员）
    while (queue.length > 0 && queue[0] !== item) {
      const head = queue.shift()!
      result.push(head)
      if (prevSet.has(head)) placed.add(head)
    }
    queue.shift()
    placed.add(item)
    result.push(item)
  }

  // 新视图尾部多出的成员追加到末尾
  return result.concat(queue)
}
