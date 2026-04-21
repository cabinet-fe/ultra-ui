# @cat-kit/core 示例

## 数组

```ts
import { arr, union } from '@cat-kit/core'

const xs = union([1, 2], [2, 3])
```

## 树

```ts
import { TreeManager } from '@cat-kit/core'

const tree = new TreeManager({ id: '1', children: [] })
```

完整导出见 [`generated/index.d.ts`](generated/index.d.ts)。
