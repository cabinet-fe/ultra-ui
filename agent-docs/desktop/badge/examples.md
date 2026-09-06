---
title: UBadge 徽标示例
description: 用 UBadge 给内容叠加数值、最大值截断或圆点徽标
---

`UBadge` 包裹目标内容，在右上角叠一层徽标。`value` 为数字时超过 `max`（默认 99）显示为 `max+`。`dot` 只显示小圆点，忽略文案。`hidden` 为真时不渲染徽标。`type` 取 `primary` / `info` / `success` / `warning` / `danger`；也可用 `color` 指定背景色。

```vue
<template>
  <u-badge :value="5">
    <u-button>消息</u-button>
  </u-badge>
  <u-badge :value="120" type="warning">
    <u-button>通知</u-button>
  </u-badge>
  <u-badge :value="200" :max="99">
    <u-button>超过上限</u-button>
  </u-badge>
  <u-badge dot>未读</u-badge>
  <u-badge :value="8" hidden>
    <u-button>已读</u-button>
  </u-badge>
</template>
```
