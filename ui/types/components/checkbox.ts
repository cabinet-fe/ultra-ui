import type { FormComponentProps } from '../component-common'

type Val = boolean | string | number

/** 复选框组件属性 */
export interface CheckboxProps<V extends Val = boolean>
  extends FormComponentProps {
  /** 自定义真值 */
  trueValue?: V
  /** 自定义假值 */
  falseValue?: V
  /** 部分选中 */
  indeterminate?: boolean
  /** 是否选中  */
  modelValue?: V
}

export interface CheckboxEmits<V extends Val = boolean> {
  (name: 'update:modelValue', value: V): void
}

/** 复选框暴露的属性和方法 */
export interface CheckboxExposed {}
