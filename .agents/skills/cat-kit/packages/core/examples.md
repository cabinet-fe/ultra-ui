# @cat-kit/core 示例

## 数组操作

```ts
import { union, unionBy, arr, omitArr, last, eachRight } from '@cat-kit/core'

// 数组合并去重
union([1, 2, 3], [2, 3, 4], [3, 4, 5])
// → [1, 2, 3, 4, 5]

// 对象数组按字段去重（保留先出现的）
unionBy('id',
  [{ id: 1, name: 'a' }, { id: 2, name: 'b' }],
  [{ id: 2, name: 'b2' }, { id: 3, name: 'c' }]
)
// → [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }]

// 链式数组操作
arr([1, 2, 3, 4, 5]).omit(0).move(3, 1).last
// → 5
```

## 对象操作

```ts
import { o } from '@cat-kit/core'

// 链式对象操作
const obj = { a: 1, b: 2, c: 3, nested: { x: 1 } }
o(obj).pick(['a', 'c']).extend({ d: 4 }).copy()
// → { a: 1, c: 3, d: 4 }
```

## 字符串

```ts
import { str, $str } from '@cat-kit/core'

str('hello-world').camelCase()            // 'helloWorld'
str('HelloWorld').kebabCase()             // 'hello-world'
str('hello-world').camelCase('upper')     // 'HelloWorld'

$str.joinUrlPath('https://api.example.com/', 'v1/', '/users')
// 'https://api.example.com/v1/users'
```

## 树

```ts
import { TreeManager, dfs, bfs } from '@cat-kit/core'

// TreeManager
const tree = new TreeManager({ id: 'root', children: [
  { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] },
  { id: 'b' }
] })

tree.dfs(node => console.log(node.data.id))
// root → a → a1 → a2 → b

tree.getLeaves().map(n => n.data.id) // ['a1', 'a2', 'b']
tree.getMaxDepth() // 2

// 独立遍历函数
const data = { id: 1, items: [{ id: 2 }, { id: 3 }] }
dfs(data, node => console.log(node.id), 'items') // 1, 2, 3
bfs(data, node => console.log(node.id), 'items') // 1, 2, 3
```

## 日期

```ts
import { date, Dater } from '@cat-kit/core'

const d = date('2024-01-15')

d.format()                        // '2024-01-15'
d.format('yyyy年MM月dd日')         // '2024年01月15日'
d.addMonths(1).format()           // '2024-02-15'
d.startOf('month').format()       // '2024-01-01'
d.endOf('month').format()         // '2024-01-31'
d.diff(date('2024-03-15'))        // 60 (天数差)

// 解析
Dater.parse('2024年01月15日', 'yyyy年MM月dd日')
```

## 数据校验

```ts
import { object, vString, vNumber, vArray, optional } from '@cat-kit/core'

const schema = object({
  name: vString(),
  age: optional(vNumber(), { default: 0 }),
  tags: vArray(vString())
})

schema.parse({ name: 'Alice', tags: ['admin'] })
// { name: 'Alice', age: 0, tags: ['admin'] }

const result = schema.safeParse({ name: 123 })
// { success: false, issues: [{ path: 'name', message: '...' }] }
```

## 高精度运算

```ts
import { $n } from '@cat-kit/core'

$n.plus(0.1, 0.2)             // 0.3
$n.mul('19.9', 100)           // 1990
$n.div(10, 3)                 // 3.33333333333333333333
$n.calc('(0.1 + 0.2) * 10')  // 3
```

## Observable

```ts
import { Observable } from '@cat-kit/core'

const store = new Observable({ count: 0, loading: false })

const unsub = store.observe(['count'], ({ count }) => {
  console.log('count changed:', count)
})

store.state.count = 1  // 触发回调
store.setState({ count: 5, loading: true }) // 批量更新，触发一次回调
unsub()
store.state.count = 10 // 不再触发
```

## 防抖与节流

```ts
import { debounce, throttle, sleep } from '@cat-kit/core'

// 搜索输入防抖
const onSearch = debounce((keyword: string) => {
  fetch(`/api/search?q=${keyword}`)
}, 300)

// 滚动节流
const onScroll = throttle(() => {
  console.log(window.scrollY)
}, 100)

await sleep(500) // 等待 500ms
```

## 并发控制

```ts
import { parallel } from '@cat-kit/core'

const results = await parallel(
  [
    () => fetch('/api/a'),
    () => fetch('/api/b'),
    () => fetch('/api/c'),
  ],
  { concurrency: 2 }
)
```

## 环境检测

```ts
import { isInBrowser, isInNode, getOSType, getEnvironmentSummary } from '@cat-kit/core'

if (isInBrowser()) {
  console.log('运行在浏览器中')
}

const env = getEnvironmentSummary()
// { os: 'MacOS', browser: 'Chrome', device: 'Desktop', ... }
```

> 类型参考：`../../generated/core/index.d.ts`
