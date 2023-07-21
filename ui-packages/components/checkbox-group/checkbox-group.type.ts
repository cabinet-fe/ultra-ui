import { FormComponentProps } from '@ui/shared'

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupProps<Data extends Record<string, string | number>>
  extends FormComponentProps {
  modelValue?: Array<string | number>
  data: Data[]
  labelKey?: string
  valueKey?: string
}

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupEmits {
  (e: 'update:modelValue', value: Array<string> | Array<number>): void
}

/** 复选框组, 用来选择一组数据暴露的属性和方法 */
export interface CheckboxGroupExposed {}
