import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties, ShallowRef } from 'vue'

/** 选择器组件属性 */
export interface SelectProps extends FormComponentProps {
  /** 绑定值 */
  modelValue?: any
  /**
   * 列表选项
   * @description 如果传入一个函数，那么filterable会被强制启用
   */
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段 */
  valueKey?: string
  /** 标签字段 */
  labelKey?: string
  /**
   * 兜底展示文案
   * @description modelValue 未命中选项时展示 text（如回显数据已不在选项中），命中时展示选项 label
   */
  text?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 占位符 */
  placeholder?: string
  /** 是否启用搜索功能 */
  filterable?: boolean
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 内容容器类名 */
  contentClass?: unknown
  /** 弹框最小宽度 */
  minWidth?: string
  /**
   * 弹框宽度
   * @default 跟随触发元素的宽度
   */
  width?: string
  /** 是否允许创建新的选项 */
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

export interface _SelectExposed {
  /** 信息文本 */
  infoText: ShallowRef<string | number>
}

export type SelectExposed = DeconstructValue<_SelectExposed>
