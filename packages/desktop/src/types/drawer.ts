import type { DeconstructValue } from '@veltra/utils'

/** 抽屉方向 */
export type DrawerDirection = 'left' | 'right' | 'top' | 'bottom'

/** 抽屉模式 */
export type DrawerMode = 'edge' | 'inset'

/** 抽屉组件属性 */
export interface DrawerProps {
  /** 是否显示抽屉 */
  modelValue?: boolean
  /** 抽屉方向 */
  direction?: DrawerDirection

  /** 是否显示关闭按钮 */
  showClose?: boolean
  /**
   * 抽屉标题；传入时在内容区上方渲染标题栏
   * @description 不传则不渲染标题栏，内容仍全部来自默认插槽
   */
  title?: string
}

/** 抽屉组件定义的事件 */
export interface DrawerEmits {
  (e: 'update:modelValue', value: boolean): void
  /** 开始关闭时触发（点遮罩、点关闭按钮） */
  (e: 'close'): void
  /** 完全关闭后触发：抽屉与遮罩的退出动画结束、节点已移除时 */
  (e: 'closed'): void
}

/** 抽屉组件暴露的属性和方法(组件内部使用) */
export interface _DrawerExposed {}

/** 抽屉组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DrawerExposed = DeconstructValue<_DrawerExposed>
