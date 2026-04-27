# core — data

数据处理工具，涵盖数组、对象、字符串、类型检测、数据转换、校验、高精度运算。

## 数组操作

### `union`

```ts
function union<T>(...arrList: T[][]): T[]
```

合并多个数组并去重（基于 `Set`）。

- **注意**：引用类型按引用去重，非深度比较。

```ts
union([1, 2], [2, 3], [3, 4]) // [1, 2, 3, 4]
```

### `unionBy`

```ts
function unionBy<T extends Record<string, any>>(key: string, ...arrList: T[][]): T[]
```

合并多个对象数组，按指定字段去重（保留先出现的）。

```ts
unionBy('id', [{ id: 1, name: 'a' }], [{ id: 1, name: 'b' }])
// [{ id: 1, name: 'a' }]
```

### `last`

```ts
function last<T extends any[]>(arr: T): Last<T>
```

获取数组最后一个元素。支持 tuple 类型推断。

### `eachRight`

```ts
function eachRight<T>(arr: T[], cb: (v: T, i: number, arr: T[]) => void): void
```

从右到左遍历数组。

### `omitArr`

```ts
function omitArr<T>(arr: T[], indexes: number | number[]): T[]
```

丢弃指定索引的元素，返回新数组。

### `arr` — 链式包装

```ts
function arr<T>(arr: T[]): Arr<T>
```

创建 `Arr` 实例，支持链式操作：

| 方法 | 说明 |
|------|------|
| `.eachRight(cb)` | 从右到左遍历 |
| `.omit(indexes)` | 丢弃指定索引，返回新 `Arr` |
| `.find(query)` | 按条件对象匹配查找 |
| `.move(from, to)` | 移动元素位置 |
| `.groupBy(cb)` | 按回调分组，返回 `Record<string, T[]>` |
| `.last` (getter) | 最后一个元素 |

```ts
arr([1, 2, 3, 4]).omit(0).last // 4
```

## 对象操作

### `o` — 链式包装

```ts
function o<O extends Record<string, any>>(object: O): CatObject<O>
```

创建 `CatObject` 实例，支持链式操作：

| 方法 | 说明 |
|------|------|
| `.keys()` | 返回键数组 |
| `.each(cb)` | 遍历每个键值对 |
| `.pick(keys)` | 选取指定键，返回新 `CatObject` |
| `.omit(keys)` | 丢弃指定键，返回新 `CatObject` |
| `.extend(source)` | 浅合并源对象 |
| `.deepExtend(source)` | 深层合并源对象 |
| `.copy()` | 浅拷贝 |
| `.merge(source)` | 合并后返回新 `CatObject`（不修改原对象） |
| `.get(prop)` | 获取属性值 |
| `.set(prop, value)` | 设置属性值 |

## 字符串

### `str` — 链式包装

```ts
function str(str: string): CatString
```

| 方法 | 说明 |
|------|------|
| `.camelCase('lower' \| 'upper')` | 转为驼峰命名，默认 lower |
| `.kebabCase()` | 转为 kebab-case |

### `$str.joinUrlPath`

```ts
$str.joinUrlPath(firstPath: string, ...paths: string[]): string
```

拼接 URL 路径，自动处理连续斜杠和协议前缀。

```ts
$str.joinUrlPath('https://api.example.com/', '/v1/', '/users')
// 'https://api.example.com/v1/users'
```

## 类型检测

| 函数 | 签名 | 说明 |
|------|------|------|
| `getDataType(v)` | `(value: any) => string` | 返回类型字符串：`'object'`、`'array'`、`'string'`、`'number'`、`'function'`、`'boolean'`、`'blob'`、`'date'`、`'file'`、`'formdata'`、`'symbol'`、`'promise'`、`'arraybuffer'`、`'uint8array'`、`'uint16array'`、`'null'`、`'undefined'` |
| `isObj(v)` | `(value: any) => value is Record<string, any>` | 是否为普通对象 |
| `isArray(v)` | `(value: any) => value is Array<any>` | 委托 `Array.isArray` |
| `isString(v)` | `(value: any) => value is string` | |
| `isNumber(v)` | `(value: any) => value is number` | |
| `isFunction(v)` | `(value: any) => value is Function` | |
| `isBool(v)` | `(value: any) => value is boolean` | |
| `isDate(v)` | `(value: any) => value is Date` | |
| `isPromise(v)` | `(value: any) => value is Promise<any>` | |
| `isNull(v)` | `(value: any) => value is null` | |
| `isUndef(v)` | `(value: any) => value is undefined` | |
| `isEmpty(v)` | `(value: any) => boolean` | null 或 undefined 为 true |
| `isBlob(v)` / `isFile(v)` / `isFormData(v)` | | 浏览器类型检测 |

另有 `isArrayBuffer`、`isUint8Array`、`isUint16Array`、`isUint32Array`、`isInt8Array`、`isInt16Array`、`isInt32Array`、`isSymbol` 的检测函数。

## 数据转换

### `str2u8a` / `u8a2str`

```ts
function str2u8a(data: string): Uint8Array
function u8a2str(data: Uint8Array): string
```

字符串与 `Uint8Array` 互转。浏览器优先使用 `TextEncoder`/`TextDecoder`，Node.js 回退 `Buffer`。

### `u8a2hex` / `hex2u8a`

```ts
function u8a2hex(u8a: Uint8Array): string
function hex2u8a(hex: string): Uint8Array
```

`Uint8Array` 与十六进制字符串互转。`hex2u8a` 支持 `0x` 前缀，奇数长度或非法字符会抛错。

### `base642u8a` / `u8a2base64`

```ts
function base642u8a(base64: string): Uint8Array
function u8a2base64(u8a: Uint8Array): string
```

Base64 与 `Uint8Array` 互转。Node.js 用 `Buffer`，浏览器用 `atob`/`btoa`。

### `obj2query` / `query2obj`

```ts
function obj2query(obj: Record<string, any>): string
function query2obj(query: string): Record<string, any>
```

URL 查询字符串与对象互转。互为逆操作，非原始值自动 `JSON.stringify`/`JSON.parse`。

```ts
obj2query({ a: 1, b: 'hello', c: [1, 2] }) // 'a=1&b=hello&c=%5B1%2C2%5D'
```

### `transform`

```ts
function transform<T>(data: any, chain: [...TransformMethod[], T]): ReturnType<T>
```

函数式链式数据转换。最后一个参数为最终转换函数，之前为中间处理步骤。

## 数据校验

基于 Parser/Validator 模式的运行时校验系统。

### `createValidator`

```ts
function createValidator<T>(parser: Parser<T>): Validator<T>
```

从 Parser 函数创建 Validator 对象，提供 `.safeParse(input)` 和 `.parse(input)`。

- `.safeParse(input)` 返回 `SafeParseResult<T>`（`{ success, data }` 或 `{ success, issues }`）
- `.parse(input)` 校验失败时抛出 `ValidationError`

### 基础 Parser

```ts
function vString(): Parser<string>
function vNumber(): Parser<number>    // 要求有限数字
function vBoolean(): Parser<boolean>
function vDate(): Parser<Date>        // 要求有效 Date
```

### 组合 Parser

```ts
function object<S>(schema: S): Validator<InferObjectSchema<S>>
function vArray<T>(item: Parser<T>): Parser<T[]>
function optional<T>(parser: Parser<T>, options?: { default?: T | (() => T) }): Parser<T | undefined>
```

```ts
const userSchema = object({
  name: vString(),
  age: optional(vNumber(), { default: 0 }),
  tags: vArray(vString())
})

const result = userSchema.parse({ name: 'Alice', tags: ['admin'] })
// result: { name: string; age?: number | undefined; tags: string[] }
```

## 高精度运算

### `$n` 静态工具

| 方法 | 签名 | 说明 |
|------|------|------|
| `$n.plus(...numbers)` | `(number\|string)[] => number` | 精确加法 |
| `$n.minus(...numbers)` | `(number\|string)[] => number` | 精确减法 |
| `$n.mul(a, b)` | `(number\|string, number\|string) => number` | 精确乘法 |
| `$n.div(a, b)` | `(number\|string, number\|string) => number` | 精确除法 |
| `$n.calc(expr)` | `(string) => number` | 表达式计算（双栈法） |
| `$n.formatter(options)` | `(NumberFormatOptions) => Intl.NumberFormat` | 创建格式化器 |

`$n.plus` 与 `$n.sum` 等价，支持任意个参数。

- **注意**：大数建议用 `string` 传入，避免 `number` 精度丢失。内部基于 BigInt 实现 `Decimal` 类。

```ts
$n.plus(0.1, 0.2) // 0.3（而非 0.30000000000000004）
$n.calc('0.1 + 0.2') // 0.3
$n.mul('19.9', 100) // 1990（而非 1989.9999999999998）
```

### `n` — 链式包装

```ts
function n(n: number): Num
```

| 方法 | 说明 |
|------|------|
| `.currency('CNY', config?)` | 人民币格式化（`'9,999.00'`） |
| `.currency('CNY_HAN', config?)` | 中文大写金额 |
| `.fixed(precision)` | 精度格式化，支持 `{ minPrecision?, maxPrecision? }` |
| `.each(fn)` | 从 1 遍历到 n |
| `.range(min, max)` | 钳制在区间内 |
| `.max(val)` / `.min(val)` | 限制上下界 |
| `.toNumber()` | 返回原始数值 |

> 类型签名：`../../generated/core/data/`
