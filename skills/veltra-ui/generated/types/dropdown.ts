import type { DeconstructValue } from '@veltra/utils'
import type { CSSProperties } from 'vue'

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
  contentClass?: unknown
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 显示下拉框 */
  visible?: boolean
  /** 禁用 */
  disabled?: boolean
}

/** 下拉框组件定义的事件 */
export interface DropdownEmits {
  /** 下拉框显示或隐藏事件 */
  (e: 'update:visible', visible: boolean): void
  /** 键盘事件 */
  (e: 'keydown', event: KeyboardEvent): void
}

/** 下拉框组件暴露的属性和方法(组件内部使用) */
export interface _DropdownExposed {
  /**
   * 打开下拉擦菜单
   * @param config 配置
   */
  open: (config?: {
    /** 自定义触发元素 */
    trigger?: HTMLElement
  }) => void
  /** 关闭 */
  close: () => void
  /** 更新下拉框位置 */
  updateDropdown: () => void
}

/** 下拉框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DropdownExposed = DeconstructValue<_DropdownExposed>
