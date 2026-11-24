import type { FormComponentProps } from '@veltra/utils'

/** 开关组件属性（与 @veltra/desktop USwitch 同名；轨道/手柄尺寸走 `--um-*` 移动档） */
export interface SwitchProps extends FormComponentProps {
  modelValue?: boolean
  activeText?: string
  inactiveText?: string
}

export interface SwitchEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}
