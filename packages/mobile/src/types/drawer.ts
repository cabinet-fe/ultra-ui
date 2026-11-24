import type { DeconstructValue } from '@veltra/utils'

/** 抽屉方位（NutUI 惯例 prop 名），决定滑出方向与对应边缘的拖拽关闭手势 */
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'

export type DrawerMode = 'edge' | 'inset'

export interface DrawerProps {
  modelValue?: boolean
  /** 抽屉方位，默认 bottom（移动端惯例底部面板） */
  placement?: DrawerPlacement

  showClose?: boolean
  /**
   * 抽屉标题；传入时在内容区上方渲染标题栏
   * @description 不传则不渲染标题栏，内容仍全部来自默认插槽
   */
  title?: string
}

export interface DrawerEmits {
  (e: 'update:modelValue', value: boolean): void
  /** 开始关闭时触发（点遮罩、点关闭按钮、边缘拖拽关闭） */
  (e: 'close'): void
  /** 完全关闭后触发：抽屉与遮罩的退出动画结束、节点已移除时 */
  (e: 'closed'): void
}

export interface _DrawerExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type DrawerExposed = DeconstructValue<_DrawerExposed>
