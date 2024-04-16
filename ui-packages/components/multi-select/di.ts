import type { InjectionKey, ShallowReactive } from 'vue'
import type { MultiSelectProps } from '@ui/types/components/multi-select'

export const MultiSelectDIKey: InjectionKey<{
  /** 选择器属性 */
  multiSelectProps: MultiSelectProps<Record<string, any>>

  /** 已选数据集合 */
  checkedSet: ShallowReactive<Set<Record<string, any>>>
  /** 选项类 */
  optionClass: string
  /** 波纹类 */
  rippleClass: string
}> = Symbol('MultiSelectDIKey')
