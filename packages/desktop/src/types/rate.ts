import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface RateProps extends FormComponentProps {
  /** 当前分值，v-model 双向绑定，0 到 count 之间 */
  modelValue?: number
  count?: number
  allowHalf?: boolean
  /** 自定义字符，不传时渲染星形图标 */
  character?: string
  /** 自定义选中颜色，默认取主题 warning 色 */
  color?: string
}

export interface RateEmits {
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}

export interface _RateExposed {}

/** 评分组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RateExposed = DeconstructValue<_RateExposed>
