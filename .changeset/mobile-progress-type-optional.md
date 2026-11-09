---
"@veltra/mobile": patch
---

`UProgress` 的 `type` 改为可选并默认 `primary`。此前为必填，且组件颜色完全依赖 type 修饰类，不传时条形与圆环没有颜色；现与 badge / button / message / tag 的可选惯例一致，无 type 用法直接可用。
