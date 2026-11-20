import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

/** 树形选择器组件属性（移动端形态：面板走 BottomSheet） */
export interface TreeSelectProps extends FormComponentProps {
  /** 绑定值 */
  modelValue?: string | number

  /**
   * 兜底展示文案
   * @description modelValue 未命中树节点时展示 text（如回显数据已不在选项中），命中时展示节点 label
   */
  text?: string

  /**
   * 树数据
   * @description 如果传入一个函数，那么 filterable 会被强制启用；
   * 函数按查询词返回匹配的树，初始以空串调用一次（加载默认树）
   */
  data?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])

  /** 值字段 */
  valueKey?: string

  /** 标签字段 */
  labelKey?: string

  /** 子级字段 */
  childrenKey?: string

  /**
   * 节点禁用判定
   * @description 传字段名时按节点数据该字段的真值禁用（如 lockFlag 非 0 时禁用）；
   * 传函数时由调用方自定义：`(node) => boolean` 返回真值禁用该节点。
   * 禁用节点不可选中，仍可展开查看子级
   */
  disabledNode?: string | ((data: Record<string, any>) => boolean)

  /** 占位符 */
  placeholder?: string

  /** 是否可清除 */
  clearable?: boolean

  /** 是否启用搜索功能 */
  filterable?: boolean

  /** 面板展开时默认展开全部节点；false 时仅展开选中节点的祖先链 */
  expandAll?: boolean

  /** 底部面板内容容器样式 */
  contentStyle?: CSSProperties | string

  /** 底部面板内容容器类名 */
  contentClass?: unknown
}

/** 树形选择器组件定义的事件 */
export interface TreeSelectEmits {
  (e: 'update:modelValue', value?: string | number): void
  /**
   * 选中项文案变化（用于同步父级冗余字段）
   * @description 命中节点时发出 label，清空时发出 undefined；未命中节点时，
   * 传了 text 兜底则不发出（父级文案已是事实来源），未传 text 时发出 undefined；readonly 下不发出
   */
  (e: 'update:text', text?: string): void
  (e: 'change', node?: Record<string, any>): void
  (e: 'clear'): void
}

/** 树形选择器组件暴露的属性和方法(组件内部使用) */
export interface _TreeSelectExposed {}

/** 树形选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeSelectExposed = DeconstructValue<_TreeSelectExposed>
