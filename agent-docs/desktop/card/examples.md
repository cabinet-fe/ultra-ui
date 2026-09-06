---
title: UCard 系列示例
description: 用页头、封面、正文与操作区拼一张卡片，子组件只能放在 UCard 内
---

`UCardHeader` / `UCardCover` / `UCardContent` / `UCardAction` 必须写在 `UCard` 里（脱离卡片会丢样式并告警）。`integrate` 去掉阴影，适合嵌进已有底的布局。`UCardCover` 的 `src` 必填。

## UCard / UCardHeader / UCardContent / UCardAction

```vue
<template>
  <u-card width="360">
    <u-card-header>项目概览</u-card-header>
    <u-card-content>本周完成 12 个任务，剩余 3 个阻塞项。</u-card-content>
    <u-card-action align-right>
      <u-button type="primary" text>取消</u-button>
      <u-button type="primary">确认</u-button>
    </u-card-action>
  </u-card>
</template>
```

`align-right` 把操作区按钮靠右。

## UCardCover

```vue
<template>
  <u-card width="360">
    <u-card-cover src="/cover.jpg" height="160" />
    <u-card-content>封面图下方的说明文字。</u-card-content>
  </u-card>
</template>
```
