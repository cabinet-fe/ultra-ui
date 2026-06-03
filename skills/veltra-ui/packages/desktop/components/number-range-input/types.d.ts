import type { NumberInputProps } from './number-input'

/** 数字范围 [起始, 结束] */
export type NumberRangeTuple = [number | undefined, number | undefined]

/** 数字范围输入组件属性 */
export interface NumberRangeInputProps extends Omit<
  NumberInputProps,
  'modelValue' | 'placeholder'
> {
  modelValue?: NumberRangeTuple
  /** 与 `modelValue[0]` 同步，可用 `v-model:start` */
  start?: number
  /** 与 `modelValue[1]` 同步，可用 `v-model:end` */
  end?: number
  /** 左侧占位 */
  startPlaceholder?: string
  /** 右侧占位 */
  endPlaceholder?: string
  /** 中间分隔文案 */
  separator?: string
}

/** 数字范围输入组件事件 */
export interface NumberRangeInputEmits {
  (event: 'update:modelValue', value: NumberRangeTuple): void
  (event: 'update:start', value: number | undefined): void
  (event: 'update:end', value: number | undefined): void
  (event: 'change', value: NumberRangeTuple): void
}

/** 数字范围输入组件暴露 */
export interface NumberRangeInputExposed {}
