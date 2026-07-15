# 转换与校验 — 示例

```ts
import {
  hex2u8a,
  object,
  optional,
  transform,
  u8a2hex,
  vArray,
  vNumber,
  vString
} from '@cat-kit/core'

const hex = u8a2hex(new TextEncoder().encode('hi'))
const bytes = hex2u8a(hex)

const upper = transform('hello', [(s) => String(s).toUpperCase(), (s) => `${s}!`])

const schema = object({
  name: vString(),
  age: optional(vNumber(), { default: 18 }),
  tags: vArray(vString())
})

const result = schema.safeParse({ name: 'cat', tags: ['admin'] })
if (result.success) {
  console.log(result.data.age) // 18
}
```
