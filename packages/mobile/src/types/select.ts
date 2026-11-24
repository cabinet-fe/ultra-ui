import type { FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

/** 选择器组件属性（移动端形态：面板走 BottomSheet） */
export interface SelectProps extends FormComponentProps {
  modelValue?: any
  /**
   * 列表选项
   * @description 如果传入一个函数，那么filterable会被强制启用
   */
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  valueKey?: string
  labelKey?: string
  /**
   * 兜底展示文案
   * @description modelValue 未命中选项时展示 text（如回显数据已不在选项中），命中时展示选项 label
   */
  text?: string
  clearable?: boolean
  placeholder?: string
  filterable?: boolean
  contentStyle?: CSSProperties | string
  contentClass?: unknown
  creatable?: boolean

  /**
   * 配置网格布局
   *
   * - 开启网格布局将会导致虚拟滚动失效，因此网格布局不适合大量数据
   * @example
   * ```ts
   * const grid = true
   * // 或者
   * const grid = {
   *   cols: 12,
   *   gap: 10
   * }
   * ```
   */
  grid?: { cols: number; gap?: number }
}

export interface SelectEmits {
  /**
   * 选中项文案变化（用于同步父级冗余字段）
   * @description 命中选项时发出 label，清空时发出 undefined；未命中选项时，
   * 传了 text 兜底则不发出（父级文案已是事实来源），未传 text 时发出 undefined；readonly 下不发出
   */
  (e: 'update:text', text?: string): void
  (e: 'update:modelValue', modelValue?: any): void
  (e: 'change', option?: Record<string, any>): void
}
