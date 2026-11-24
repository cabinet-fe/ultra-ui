import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties, ShallowRef } from 'vue'

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
  /**
   * 标签字段
   * @default 'label'
   * @description 显式配置时 update:text 回发 `row[labelKey]` 原始取值；未配置时回发展示文案（labelTemplate 渲染结果）
   */
  labelKey?: string
  /**
   * 标签展示模板
   * @description `{fieldKey}` 占位符按选项行字段插值（支持嵌套路径取值），
   * 模板引用的字段在行中取不到时整体回退 `row[labelKey]`；
   * 配置后下拉选项与选中回显等展示文案统一渲染模板结果；
   * update:text 回发显式配置的 `labelKey` 原始取值，未配置 labelKey 时回发模板渲染结果
   * @example '{label}（{code}）'
   */
  labelTemplate?: string
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
  minWidth?: string
  /**
   * 弹框宽度
   * @default 跟随触发元素的宽度
   */
  width?: string
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
  infoText: ShallowRef<string | number>
}

export type SelectExposed = DeconstructValue<_SelectExposed>
