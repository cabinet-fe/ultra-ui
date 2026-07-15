# core — 数组与对象

## 何时使用

- 多数组合并去重、按字段去重、读尾元素、删索引或从右遍历
- 对对象挑选/忽略字段，或按既定形状更新配置

## 推荐公开 API

- 函数：`union`、`unionBy`、`last`、`eachRight`、`omitArr`
- `arr(value)`：`eachRight`、`omit`、`find`、`last`、`move`、`groupBy`
- `o(value)`：`keys`、`each`、`pick`、`omit`、`extend`、`deepExtend`、`copy`、`merge`、`get`、`set`

仅需尾元素且不依赖元组尾项推断时可用原生 `array.at(-1)`；简单去重可用 `Set`。

详情见 [apis.md](apis.md)、[examples.md](examples.md)。

## 约束

- `union` 按引用/`Set` 去重；`unionBy` 保留同 key 首次出现
- `arr()` 非持续链式：方法直接返回数组或对象
- `pick`/`omit`/`copy` 返回新对象；`extend`/`deepExtend`/`merge`/`set` 修改原对象
- `extend`/`deepExtend` 只更新目标已有键，忽略 `null`/`undefined`；`merge` 可增键
- `copy` 为 JSON 语义，不适合函数、循环引用或需保留原型的值
- `o().get` 找不到返回 `undefined`；`isEmpty` 仅指 `null`/`undefined`（见 string-type）

## 类型入口

[array.d.ts](../../../generated/core/data/array.d.ts) · [object.d.ts](../../../generated/core/data/object.d.ts)
