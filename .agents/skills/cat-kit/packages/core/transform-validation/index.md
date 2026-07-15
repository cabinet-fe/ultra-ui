# core — 转换与校验

## 何时使用

- 字符串 ↔ Uint8Array、十六进制、Base64
- 对象 ↔ 查询串（JSON 值语义，非普通表单）
- 同步转换链、对象 schema 校验

## 推荐公开 API

- 编解码：`str2u8a`、`u8a2str`、`u8a2hex`、`hex2u8a`、`base642u8a`、`u8a2base64`、`obj2query`、`query2obj`
- `transform(data, chain)`：同步依次执行函数数组，返回最后一环结果（**无** `.pipe()` / `.value()`）
- 校验：`createValidator`、`object`、`optional`、`vString`、`vNumber`、`vBoolean`、`vDate`、`vArray`、`ValidationError`

详情见 [apis.md](apis.md)、[examples.md](examples.md)。

## 约束

- `hex2u8a` 允许空白与 `0x`；空输入得空字节；奇数长度/非法 hex 抛错
- `obj2query`/`query2obj` 成对；`null`/`undefined` 序列化为空查询值，解析回 `''`
- `object(schema)` 只保留 schema 键并聚合字段错误
- `optional` 仅把 `undefined` 当缺省；`vNumber` 要求有限数；`vDate` 拒绝 Invalid Date

## 类型入口

[transform.d.ts](../../../generated/core/data/transform.d.ts) · [validator.d.ts](../../../generated/core/data/validator.d.ts)
