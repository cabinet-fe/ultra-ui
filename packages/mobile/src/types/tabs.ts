import type { ComponentProps } from '@veltra/utils'

export type TabItem = {
  /**
   * 标题名称
   * @description 如果不传则以 key 为名称
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
  rounded?: boolean
  position?: 'left' | 'right' | 'top' | 'bottom'
  keepAlive?: boolean
}

export interface TabsEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

export interface _TabsExposed {}

/** 组件外部使用，引用的值会被自动解构 */
export interface TabsExposed {}
