---
title: "UDatePanel - 日期面板"
description: "UDatePanel 组件 API"
---

# UDatePanel - 日期面板

## 类型

```ts
import type { Dater } from '@cat-kit/core'
import type { FormComponentProps } from '@veltra/utils'

export type PanelType = 'day' | 'month' | 'year'

export interface DatePanelProps {
  date?: Dater
  rangeDate?: [Dater, Dater]
  range?: boolean
  disabledDate?: (date: Dater, raw: Date) => boolean
  type?: 'date' | 'month' | 'year'
  size?: FormComponentProps['size']
}

export interface DatePanelEmits {
  (e: 'select:date', date: Dater): void
  (e: 'select:range-date', rangeDate?: [Dater, Dater]): void
}
```

## 示例

见 `./examples.md`
