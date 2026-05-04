import type { ComponentSize, DeconstructValue } from '@veltra/utils'
import type { Component } from 'vue'

/** Collapse 项的唯一标识 */
export type CollapseValue = string | number

/** Collapse modelValue：手风琴模式为单值，普通模式为数组（也兼容传入单值） */
export type CollapseModelValue = CollapseValue | CollapseValue[]

/** 展开图标位置 */
export type CollapseIconPosition = 'left' | 'right'

/** Collapse 组件属性 */
export interface CollapseProps {
  /** 当前展开项的 value（单个或多个） */
  modelValue?: CollapseModelValue

  /** 是否手风琴模式（一次只能展开一项） */
  accordion?: boolean

  /**
   * 是否显示外层与项之间的分隔线（设为 false 时为 ghost 风格）
   * @default true
   */
  bordered?: boolean

  /**
   * 展开/收起图标位置
   * @default 'right'
   */
  iconPosition?: CollapseIconPosition

  /**
   * 自定义展开图标组件，活动态会自动旋转 90°。
   * 接受任意 Vue 组件（SFC、Functional Component 等）。
   */
  expandIcon?: Component

  /** 组件尺寸，与全局尺寸 token 联动 */
  size?: ComponentSize
}

export interface CollapseEmits {
  (e: 'update:modelValue', value: CollapseModelValue): void
  /** 当前展开项变更时触发 */
  (e: 'change', value: CollapseModelValue): void
}

/** Collapse 暴露的实例方法 */
export interface _CollapseExposed {
  /** 切换某项的展开状态 */
  toggle: (value: CollapseValue) => void
  /** 展开某项 */
  expand: (value: CollapseValue) => void
  /** 收起某项 */
  collapse: (value: CollapseValue) => void
  /** 展开全部（accordion 模式下展开第一个传入的 value） */
  expandAll: (values: CollapseValue[]) => void
  /** 全部收起 */
  collapseAll: () => void
}

export type CollapseExposed = DeconstructValue<_CollapseExposed>

/** CollapseItem 组件属性 */
export interface CollapseItemProps {
  /** 唯一标识 */
  value: CollapseValue

  /** 标题文本（也可使用 #title 插槽） */
  title?: string

  /** 是否禁用 */
  disabled?: boolean

  /** 是否隐藏展开图标 */
  hideIcon?: boolean
}
