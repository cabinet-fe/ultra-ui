import type { ComponentProps, ComponentSize } from '@veltra/utils'

export type TabItem = {
  /**
   * 标题名称
   * @description 如果不穿则以key为名称
   */
  name?: string
  /**
   * 标签页唯一标识
   */
  key: string
  /** 是否禁用 */
  disabled?: boolean
  /**
   * 单个标签是否可关闭
   * @description 未显式设置时，沿用组件级 `closable` 属性
   */
  closable?: boolean
}

/** 水平标签栏（top/bottom）属性 */
export interface TabsHorizontalProps {
  /** 组件尺寸 */
  size?: ComponentSize
  /** 当前激活的标签 key */
  modelValue?: string
  /** 标签项 */
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
   * 是否开启圆角胶囊风格
   * @default false
   */
  rounded?: boolean
  /**
   * 位置
   * @default 'top'
   */
  position?: 'top' | 'bottom'
}

/** 垂直标签栏（left/right）属性 */
export interface TabsVerticalProps {
  /** 组件尺寸 */
  size?: ComponentSize
  /** 当前激活的标签 key */
  modelValue?: string
  /** 标签项 */
  items: TabItem[]
  /**
   * 是否可关闭
   * @description 作为所有 TabItem 未显式 `closable` 时的默认值；禁用项不显示关闭按钮
   * @default false
   */
  closable?: boolean
  /**
   * 是否开启圆角胶囊风格
   * @default false
   */
  rounded?: boolean
  /**
   * 位置
   * @default 'left'
   */
  position?: 'left' | 'right'
}

/** 水平标签栏事件 */
export interface TabsHorizontalEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

/** 垂直标签栏事件 */
export interface TabsVerticalEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

/** 标签页组件组件属性 */
export interface TabsProps extends ComponentProps {
  /** 当前激活的标签 key */
  modelValue?: string
  /** 标签项 */
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
   * 是否开启圆角胶囊风格
   * @default false
   */
  rounded?: boolean
  /** 显示位置 */
  position?: 'left' | 'right' | 'top' | 'bottom'
  /**
   * 是否保活
   * @default false
   */
  keepAlive?: boolean
}

/** 标签页组件组件定义的事件 */
export interface TabsEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

/** 标签页组件暴露的属性和方法(组件内部使用) */
export interface _TabsExposed {}

/** 标签页组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TabsExposed {}

/** 水平标签栏暴露的属性和方法(组件内部使用) */
export interface _TabsHorizontalExposed {}

/** 水平标签栏暴露的属性和方法(组件外部使用) */
export interface TabsHorizontalExposed {}

/** 垂直标签栏暴露的属性和方法(组件内部使用) */
export interface _TabsVerticalExposed {}

/** 垂直标签栏暴露的属性和方法(组件外部使用) */
export interface TabsVerticalExposed {}
