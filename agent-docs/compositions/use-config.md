---
title: "useConfig / setDocumentSize - 组件库全局配置与全局尺寸控制"
description: "Vue 组合式函数，用于全局配置读写与全局组件尺寸（small/default/large）控制，支持 setConfig 深度合并配置并自动将尺寸类名（如 u-size-small）同步到 html 根节点，适用于管理后台全局字号与紧凑度切换"
keywords:
  - useConfig
  - setDocumentSize
  - @veltra/compositions
  - use-config
  - 组件库全局配置与全局尺寸控制
aliases: ["use-config", "useConfig", "setDocumentSize", "组件库全局配置与全局尺寸控制"]
---

## 快速上手

`useConfig` 提供只读的全局配置，以及深合并写入的 `setConfig`。同文件导出的 `setDocumentSize` 把 `ComponentSize`（`'small' | 'default' | 'large'`，来自 `@veltra/utils`）写到 `<html>` 的 class。首次调用 `useConfig` 后，`config.size` 变化会自动调用 `setDocumentSize`。

```ts
import { useConfig, setDocumentSize } from '@veltra/compositions'

const { config, setConfig } = useConfig()

setConfig({
  animation: false,
  size: 'small',
  form: { labelWidth: 120 },
  paginator: { pageSize: 100, pageSizeOptions: [100, 200, 500] }
})

setDocumentSize('large', 'small')
```

默认值：

| 字段                        | 默认                        |
| --------------------------- | --------------------------- |
| `animation`                 | `true`                      |
| `size`                      | `'default'`                 |
| `form.labelWidth`           | `100`                       |
| `paginator.pageSize`        | `40`                        |
| `paginator.pageSizeOptions` | `[40, 100, 200, 500, 1000]` |

`config` 是 `readonly` 的 reactive 对象，不要直接改字段。`setConfig` 对 `form`、`paginator` 这类嵌套对象做深合并；若把对象字段改成非对象，会在控制台告警并忽略该键。

`config.form` 只有 `labelWidth`，没有 `labelPosition`。标签位置由 `UForm` 经表单上下文提供，不要写进 `setConfig`。
