import type { ComponentProps } from '@veltra/utils'
import type { Component } from 'vue'

/** Collapse 项的唯一标识 */
export type CollapseValue = string | number

/** Collapse modelValue：手风琴模式为单值，普通模式为数组（也兼容传入单值） */
export type CollapseModelValue = CollapseValue | CollapseValue[]

/** Collapse 组件属性 */
export interface CollapseProps extends ComponentProps {
  /** 当前展开项的 value（单个或多个） */
  modelValue?: CollapseModelValue

  /**
   * 是否手风琴模式（一次只能展开一项）
   * @default false
   */
  accordion?: boolean

  /**
   * 是否默认折叠全部项。设为 false 时默认全部展开。
   * @default false
   */
  defaultCollapseAll?: boolean

  /**
   * 自定义展开图标组件，活动态会自动旋转 90°。
   * 接受任意 Vue 组件（SFC、Functional Component 等）。
   */
  expandIcon?: Component
}

export interface CollapseEmits {
  (e: 'update:modelValue', value: CollapseModelValue): void
  /** 当前展开项变更时触发 */
  (e: 'change', value: CollapseModelValue): void
}

/** CollapseItem 组件属性 */
export interface CollapseItemProps {
  /** 唯一标识 */
  value: CollapseValue

  /** 标题文本（也可使用 #title 插槽） */
  title?: string

  /** 是否禁用 */
  disabled?: boolean
}
