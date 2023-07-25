import { FormComponentProps } from "@ui/shared"

/** 输入框组件组件属性 */
export interface InputProps extends FormComponentProps {
  /** modelValue */
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 前缀 */
  prefix?: string
  /** 后缀 */
  suffix?: string
  /** 是否可清除 */
  clearable?: boolean
}

export interface InputEmits {
  (e: 'update:modelValue', value?: string): void
  (e: 'suffix:click', value?: string): void
  (e: 'prefix:click', value?: string): void
  (e: 'focus', value?: string): void
  (e: 'blur', value?: string): void
}