import type { DeconstructValue } from '@veltra/utils'
import type { CSSProperties } from 'vue'

export interface DropdownProps {
  /**
   * @default 'hover'
   */
  trigger?: 'hover' | 'click' | 'custom'
  /**
   * 弹出方向；空间不足时仍会自动翻转
   * @default 'bottom'
   */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /**
   * @default 'start'
   */
  alignment?: 'center' | 'start' | 'end'
  /**
   * 宽度
   * @default - 跟随触发宽度
   */
  width?: string
  minWidth?: string
  contentTag?: string
  contentClass?: unknown
  contentStyle?: CSSProperties | string
  visible?: boolean
  disabled?: boolean
}

export interface DropdownEmits {
  (e: 'update:visible', visible: boolean): void
  (e: 'keydown', event: KeyboardEvent): void
}

export interface _DropdownExposed {
  open: (config?: { trigger?: HTMLElement }) => void
  close: () => void
  updateDropdown: () => void
}

/** 下拉框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DropdownExposed = DeconstructValue<_DropdownExposed>
