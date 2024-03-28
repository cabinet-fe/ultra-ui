import type { FormComponentProps } from "../component-common"

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupProps<
  Data extends Record<string, string | number>,
  Val extends string | number
> extends FormComponentProps {
  /** 值 */
  modelValue?: Array<Val>
  /** 复选框项 */
  items: Item[]
  /** 标签文本的key */
  labelKey?: string
  /** 值的key */
  valueKey?: string
}

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupEmits<Val extends string | number> {
  (e: 'update:modelValue', value: Array<Val>): void
}

/** 复选框组, 用来选择一组数据暴露的属性和方法 */
export interface CheckboxGroupExposed {}
