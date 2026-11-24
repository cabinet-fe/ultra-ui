import type { DeconstructValue } from '@veltra/utils'

export type DrawerDirection = 'left' | 'right' | 'top' | 'bottom'

export type DrawerMode = 'edge' | 'inset'

export interface DrawerProps {
  modelValue?: boolean
  direction?: DrawerDirection

  /**
   * 抽屉尺寸；左右方向为宽度，上下方向为高度，数字按 px 处理
   * @description 不传时走主题 token `--u-drawer-size`（默认 320px）
   */
  size?: number | string

  showClose?: boolean
  /**
   * 抽屉标题；传入时在内容区上方渲染标题栏
   * @description 不传则不渲染标题栏，内容仍全部来自默认插槽
   */
  title?: string
  /** 是否允许按 Esc 关闭抽屉，默认 true */
  closeOnEsc?: boolean
  /** 打开时是否锁定 body 滚动，默认 true */
  lockScroll?: boolean
}

export interface DrawerEmits {
  (e: 'update:modelValue', value: boolean): void
  /** 开始关闭时触发（点遮罩、点关闭按钮） */
  (e: 'close'): void
  /** 完全关闭后触发：抽屉与遮罩的退出动画结束、节点已移除时 */
  (e: 'closed'): void
}

export interface _DrawerExposed {}

/** 抽屉组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DrawerExposed = DeconstructValue<_DrawerExposed>
