import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 穿梭框选项 */
export interface TransferOption {
  /** 选项唯一标识 */
  key: string | number
  /** 选项展示文案 */
  label: string
  /** 是否禁用该选项：禁用项不可勾选、不可移动 */
  disabled?: boolean
}

/** 移动方向：right 为源栏 → 目标栏，left 为目标栏 → 源栏 */
export type TransferDirection = 'left' | 'right'

/** transfer组件属性 */
export interface TransferProps extends FormComponentProps {
  /** 绑定值：目标侧选项 key 集合 */
  modelValue?: Array<string | number>
  /** 数据源，两栏共用；按出现顺序渲染 */
  dataSource?: TransferOption[]
  /** 栏标题：[源栏, 目标栏] */
  titles?: [string, string]
  /** 是否可搜索：两栏各自按 label 过滤 */
  filterable?: boolean
  /** 搜索框占位符：[源栏, 目标栏] */
  filterPlaceholder?: [string, string]
}

/** transfer组件定义的事件 */
export interface TransferEmits {
  (e: 'update:modelValue', keys: Array<string | number>): void
  (
    e: 'change',
    targetKeys: Array<string | number>,
    direction: TransferDirection,
    movedKeys: Array<string | number>
  ): void
}

/** transfer组件暴露的属性和方法(组件内部使用) */
export interface _TransferExposed {}

/** transfer组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TransferExposed = DeconstructValue<_TransferExposed>
