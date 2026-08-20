# 树与森林 — 示例

```ts
import { TreeManager, dfs } from '@cat-kit/core'

const data = {
  id: 'root',
  children: [{ id: 'a' }, { id: 'b', children: [{ id: 'b1' }] }]
}

dfs(data, (node) => {
  console.log(node.id)
})

const tree = new TreeManager(data)
const ids = tree.flatten((node) => node.id !== 'root').map((n) => n.id)
```
