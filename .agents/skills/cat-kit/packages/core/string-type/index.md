# core — 字符串与类型检测

## 何时使用

- 驼峰 / kebab 命名转换、拼接 URL 路径段
- 运行时类型守卫（含浏览器类型如 `Blob`/`File`）

## 推荐公开 API

- `str(value)`：`.camelCase(type?)`、`.kebabCase()`
- `$str.joinUrlPath(firstPath, ...paths)`
- `getDataType`、`isObj`、`isArray`、`isString`、`isNumber`、`isBlob`、`isDate`、`isFunction`、`isBool`、`isFile`、`isFormData`、`isSymbol`、`isPromise`、各类 TypedArray 守卫、`isNull`、`isUndef`、`isEmpty`

详情见 [apis.md](apis.md)。最小示例如下。

```ts
import { $str, isNumber, str } from '@cat-kit/core'

str('hello_world').camelCase() // 'helloWorld'
str('HelloWorld').kebabCase() // '-hello-world'（每个大写前插连字符）
$str.joinUrlPath('/api/', '/users', '1')
isNumber(NaN) // true；有限数校验请用 vNumber()
```

## 约束

- `isEmpty` 仅 `null | undefined`
- 浏览器 / TypedArray 守卫依赖对应全局
- `DataType` 类型名不作为命名导出

## 类型入口

[string.d.ts](../../../generated/core/data/string.d.ts) · [type.d.ts](../../../generated/core/data/type.d.ts)
