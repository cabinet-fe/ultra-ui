import type { ComponentProps, ComponentSize } from '@veltra/utils'

export type TabItem = {
  /**
   * 标题名称
   * @description 如果不穿则以key为名称
   */
  name?: string
  key: string
  disabled?: boolean
  /**
   * 单个标签是否可关闭
   * @description 未显式设置时，沿用组件级 `closable` 属性
   */
  closable?: boolean
}

export interface TabsHorizontalProps {
  size?: ComponentSize
  modelValue?: string
  items: TabItem[]
  /**
   * 是否可关闭
   * @description 作为所有 TabItem 未显式 `closable` 时的默认值；禁用项不显示关闭按钮
   * @default false
   */
  closable?: boolean
  /**
   * 是否填充父容器宽度
   * @description 开启时 header 容器占满父容器宽度，背景完整铺开；tab-item 自身宽度保持不变
   * @default false
   */
  block?: boolean
  /**
   * @default false
   */
  rounded?: boolean
  /**
   * @default 'top'
   */
  position?: 'top' | 'bottom'
}

export interface TabsVerticalProps {
  size?: ComponentSize
  modelValue?: string
  items: TabItem[]
  /**
   * 是否可关闭
   * @description 作为所有 TabItem 未显式 `closable` 时的默认值；禁用项不显示关闭按钮
   * @default false
   */
  closable?: boolean
  /**
   * @default false
   */
  rounded?: boolean
  /**
   * @default 'left'
   */
  position?: 'left' | 'right'
}

export interface TabsHorizontalEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

export interface TabsVerticalEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

export interface TabsProps extends ComponentProps {
  modelValue?: string
  items: TabItem[]
  /**
   * 是否可关闭
   * @description 作为所有 TabItem 未显式 `closable` 时的默认值；禁用项不显示关闭按钮
   * @default false
   */
  closable?: boolean
  /**
   * 是否填充父容器宽度（仅在 position=top/bottom 时生效）
   * @description 开启时 header 容器占满父容器宽度，背景完整铺开；tab-item 自身宽度保持不变
   * @default false
   */
  block?: boolean
  /**
   * @default false
   */
  rounded?: boolean
  position?: 'left' | 'right' | 'top' | 'bottom'
  /**
   * @default false
   */
  keepAlive?: boolean
}

export interface TabsEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

export interface _TabsExposed {}

/** 标签页组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TabsExposed {}

export interface _TabsHorizontalExposed {}

export interface TabsHorizontalExposed {}

export interface _TabsVerticalExposed {}

export interface TabsVerticalExposed {}
