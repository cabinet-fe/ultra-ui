import type { DeconstructValue } from '../helper'

/** 下拉框组件属性 */
export interface DropdownProps {
  /**
   * 触发方式
   * @default 'hover'
   */
  trigger?: 'hover' | 'click' | 'custom'
  /**
   * 宽度
   * @default - 跟随触发宽度
   */
  width?: string
  /**
   * 最小宽度
   */
  minWidth?: string
  /**
   * 内容容器标签
   */
  contentTag?: string
  /** 内容容器类 */
  contentClass?: string | string[]
  /** 显示下拉框 */
  visible?: boolean
  /** 禁用 */
  disabled?: boolean
}

/** 下拉框组件定义的事件 */
export interface DropdownEmits {
  /** 下拉框显示或隐藏事件 */
  (e: 'update:visible', visible: boolean): void
}

/** 下拉框组件暴露的属性和方法(组件内部使用) */
export interface _DropdownExposed {
  /**
   * 打开
   * @param trigger 触发元素
   */
  open: (trigger?: {
    /** 虚拟触发元素 */
    virtual?: HTMLElement
    /**
     * 真实触发元素
     * @description 如果不指定则和虚拟触发元素一致
     */
    real?: HTMLElement
  }) => void
  /** 关闭 */
  close: () => void
}

/** 下拉框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DropdownExposed = DeconstructValue<_DropdownExposed>
