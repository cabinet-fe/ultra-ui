---
title: "UGanttChart - 甘特图"
description: "UGanttChart 组件 API"
---

# UGanttChart - 甘特图

## 类型

```ts
/** 甘特图组件属性 */
export interface GanttChartProps {
  modelValue?: string
}

/** 甘特图组件定义的事件 */
export interface GanttChartEmits {
  (e: 'update:modelValue', value: string): void
}

/** 甘特图组件暴露的属性和方法(组件内部使用) */
export interface _GanttChartExposed {}

/** 甘特图组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface GanttChartExposed {}
```

## 示例

见 `./examples.md`
