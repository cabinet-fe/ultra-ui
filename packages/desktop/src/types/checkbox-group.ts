import type { FormComponentProps } from '@veltra/utils'

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupProps extends FormComponentProps {
  /** 值 */
  modelValue?: Array<any>
  /** 复选框项 */
  items: Array<Record<string, any>>
  /** 标签文本的key */
  labelKey?: string
  /** 值的key */
  valueKey?: string
  /** 块级显示 */
  block?: boolean
}

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupEmits {
  (e: 'update:modelValue', value: Array<any>): void
}

/** 复选框组, 用来选择一组数据暴露的属性和方法 */
export interface CheckboxGroupExposed {}
