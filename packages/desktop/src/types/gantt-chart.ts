export interface GanttChartProps {
  modelValue?: string
}

export interface GanttChartEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _GanttChartExposed {}

/** 甘特图组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface GanttChartExposed {}
