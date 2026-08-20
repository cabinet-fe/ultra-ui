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
   * 自定义展开图标组件，活动态会自动旋转 180°。
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
  /**
   * 唯一标识；在 `UCollapse` 内使用时必填。
   * 独立使用时可选。
   */
  value?: CollapseValue

  /**
   * 独立使用时的展开状态（`v-model`）。
   * 在 `UCollapse` 内由父组件 `modelValue` 管理，此属性无效。
   * @default false
   */
  modelValue?: boolean

  /** 标题文本（也可通过 #header 插槽自定义标题区；展开图标始终保留，可用 expandIcon 替换） */
  title?: string

  /** 是否禁用 */
  disabled?: boolean

  /**
   * 独立使用时的自定义展开图标，活动态会自动旋转 180°。
   * 在 `UCollapse` 内由父组件 `expandIcon` 统一管理。
   */
  expandIcon?: Component

  /**
   * 折叠动画结束后卸载内容 DOM（展开时重新挂载），减少长列表的内存与渲染成本。
   * 注意：卸载会丢失内容区的本地组件状态。
   * @default false
   */
  destroyOnCollapse?: boolean
}

export interface CollapseItemEmits {
  (e: 'update:modelValue', value: boolean): void
  /** 展开状态变更时触发（仅独立使用） */
  (e: 'change', value: boolean): void
}
