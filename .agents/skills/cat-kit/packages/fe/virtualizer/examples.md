# 虚拟列表 — 示例

```ts
import { Virtualizer } from '@cat-kit/fe'

const rows = [{ id: 'a', height: 40 }, { id: 'b', height: 56 }]

const v = new Virtualizer({
  count: rows.length,
  estimateSize: () => 44,
  getItemKey: (i) => rows[i]!.id
})

v.setViewport(480)
v.measureMany(rows.map((row, index) => ({ index, size: row.height })))

const stop = v.subscribe(({ items, beforeSize, afterSize }) => {
  // 渲染 items，并用 beforeSize/afterSize 撑开滚动高度
  void items
  void beforeSize
  void afterSize
})

// 卸载：
stop()
v.destroy()
```
