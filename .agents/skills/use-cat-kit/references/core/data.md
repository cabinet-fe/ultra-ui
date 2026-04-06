# core — 数据处理

类型判断、对象/数组/字符串/数字操作与数据转换。

## 类型判断

```typescript
import {
  getDataType, isObj, isArray, isString, isNumber, isBool, isDate,
  isFunction, isNull, isUndef, isEmpty,
  isBlob, isFile, isFormData, isSymbol, isPromise,
  isArrayBuffer, isUint8Array
} from '@cat-kit/core'

getDataType([])   // 'array'
getDataType({})   // 'object'
isEmpty(null)     // true
isEmpty('')       // false
```

所有判断函数均带 TypeScript 类型守卫。

## 对象操作 — `o()`

```typescript
import { o } from '@cat-kit/core'

o(obj).keys()
o(obj).each((key, value) => {})
o(obj).pick(['a', 'b'])
o(obj).omit(['c'])
o(obj).copy()                         // 结构化拷贝
o(obj).merge({ d: 4 })
o(defaults).extend(userSettings)      // 只继承目标已有的键
o(defaults).deepExtend(userConfig)    // 深度继承
```

## 数组操作

```typescript
import { last, union, unionBy, eachRight, omitArr, arr } from '@cat-kit/core'

last([1, 2, 3])                    // 3
union([1, 2], [2, 3])             // [1, 2, 3]
unionBy('id', arr1, arr2)         // 按字段去重合并
omitArr([1, 2, 3, 4], [1, 3])    // 移除索引 1、3

const list = arr(users)
list.find({ age: 25 })
list.move(0, 2)
list.groupBy(u => u.role)
list.omit([0, 2])
```

## 字符串操作

```typescript
import { str, $str } from '@cat-kit/core'

str('hello-world').camelCase()         // 'helloWorld'
str('hello-world').camelCase('upper')  // 'HelloWorld'
str('helloWorld').kebabCase()          // 'hello-world'

$str.joinUrlPath('/api', 'users', '123')  // '/api/users/123'
```

## 数字操作 — `n()`

```typescript
import { n } from '@cat-kit/core'

n(1234567.89).currency('CNY', 2)       // '￥1,234,567.89'
n(1234567.89).currency('CNY_HAN', 2)   // 中文大写金额
n(3.14159).fixed(2)                    // '3.14'
n(120).range(0, 100)                   // 限制在范围内
```

精确运算：`$n.plus`, `$n.minus`, `$n.mul`, `$n.div`, `$n.sum`, `$n.calc`

## 数据转换

```typescript
import {
  str2u8a, u8a2str, u8a2hex, hex2u8a,
  u8a2base64, base642u8a,
  obj2query, query2obj, transform
} from '@cat-kit/core'

str2u8a('Hello')                       // Uint8Array
u8a2hex(bytes)                         // '48656c6c6f'
u8a2base64(bytes)                      // 'SGVsbG8='
obj2query({ name: 'Alice', age: 25 }) // 'name=Alice&age=25'
query2obj('name=Alice&age=25')         // { name: 'Alice', age: 25 }
transform('Hello').pipe(str2u8a).pipe(u8a2base64).value()
```
