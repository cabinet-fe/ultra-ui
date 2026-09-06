---
title: UWatermark 水印示例
description: 用 UWatermark 在内容区或整页叠加文字水印
---

`UWatermark` 用 `text` 绘制重复文字水印。默认旋转 `-30`、字号 60。不传 `append-to-body` 时水印包住默认插槽；`append-to-body` 为真时 Teleport 到 `body` 覆盖整页。

```vue
<template>
  <u-watermark text="内部资料" :font-size="48" :route="-24">
    <div style="min-height: 240px; padding: 24px">
      <p>这份内容带局部水印。</p>
    </div>
  </u-watermark>
</template>
```

整页水印：

```vue
<template>
  <u-watermark text="仅供内部传阅" append-to-body />
</template>
```
