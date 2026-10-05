import type { FormComponentProps } from '@veltra/utils'

/** 开关组件属性（与 @veltra/desktop USwitch 同名；轨道/手柄尺寸走 `--um-*` 移动档） */
export interface SwitchProps extends FormComponentProps {
  /** 开关状态 */
  modelValue?: boolean
  /** 打开时显示的文字 */
  activeText?: string
  /** 关闭时显示的文字 */
  inactiveText?: string
}

/** 开关组件定义的事件 */
export interface SwitchEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}
