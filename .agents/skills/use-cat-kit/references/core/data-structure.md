# core — 树与森林数据结构

```typescript
import { dfs, TreeNode, TreeManager, Forest } from '@cat-kit/core'

// 深度优先遍历
dfs(root, (node) => console.log(node.id))

// TreeNode
const node = new TreeNode({ id: 1 }, depth, index)
node.isLeaf

// TreeManager — 管理单棵树
const manager = new TreeManager({ id: 1, children: [{ id: 2 }] })
manager.flatten()

// Forest — 管理森林（多棵树）
const forest = new Forest({ data: [{ id: 1 }, { id: 2 }] })
forest.size
```

适用于菜单、组织架构、评论树等层级数据处理。
