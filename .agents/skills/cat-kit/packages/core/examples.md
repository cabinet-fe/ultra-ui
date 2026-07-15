# @cat-kit/core — 组合示例

仅在需要跨主题组合时阅读。

```ts
import {
  $n,
  date,
  object,
  parallel,
  TreeManager,
  vNumber,
  vString
} from '@cat-kit/core'

const schema = object({
  amount: vNumber(),
  label: vString()
})

const parsed = schema.parse({ amount: 19.9, label: 'item' })
const total = $n.mul(parsed.amount, 100)
const due = date().addDays(7).format('yyyy-MM-dd')

const tree = new TreeManager({
  id: 'root',
  children: [{ id: 'a' }, { id: 'b' }]
})

const ids = await parallel(
  tree.flatten((n) => n.id !== 'root').map((n) => async () => n.id),
  { concurrency: 2 }
)

console.log(total, due, ids)
```
