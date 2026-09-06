---
title: useConfig 与 setDocumentSize 全局配置
description: 读写组件库全局配置，并把尺寸类名同步到 documentElement
---

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

| 字段 | 默认 |
| --- | --- |
| `animation` | `true` |
| `size` | `'default'` |
| `form.labelWidth` | `100` |
| `paginator.pageSize` | `40` |
| `paginator.pageSizeOptions` | `[40, 100, 200, 500, 1000]` |

`config` 是 `readonly` 的 reactive 对象，不要直接改字段。`setConfig` 对 `form`、`paginator` 这类嵌套对象做深合并；若把对象字段改成非对象，会在控制台告警并忽略该键。

`config.form` 只有 `labelWidth`，没有 `labelPosition`。标签位置由 `UForm` 经表单上下文提供，不要写进 `setConfig`。
