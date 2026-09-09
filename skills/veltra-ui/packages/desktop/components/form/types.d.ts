import type { ComponentProps, DeconstructValue } from '@veltra/utils'
import type { ShallowRef } from 'vue'

/** 表单组件属性 */
export interface FormProps extends ComponentProps {
  /**
   * 自定义表单列数
   * - 默认根据尺寸断点自动排列
   */
  cols?: number
  /** 表单数据 */
  model?: Record<string, any>
  /** 开启后，字段当前值与基准值不同时，在控件下方展示「变更前」 */
  showModified?: boolean
  /** 「变更前」标签文案，默认「变更前：」 */
  modifiedLabel?: string
  /** 变更前基准数据；未传时回退到 model 引用首次传入时的快照（与 reset 一致） */
  initialModel?: Record<string, any>
  /** 表单项label宽度 */
  labelWidth?: string | number
  /** 表单项 label 位置 */
  labelPosition?: 'top' | 'left'
  /** 是否不显示tips */
  noTips?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否禁用 */
  disabled?: boolean
}

export interface FormEmits {
  /** 控件 change 事件，仅用户操作触发 */
  (e: 'field:change', field: string, ...args: any[]): void
  /** model 字段值更新，含编程写入 */
  (e: 'field:update', field: string, value: any): void
}

export interface _FormExposed {
  el: ShallowRef<HTMLElement | null | undefined>
  validate: (keys?: string[]) => Promise<boolean>
  clearValidate: () => void
  /** 将 model 恢复为最近一次 props.model 引用变更时的快照，并清除校验 */
  reset: () => void
}

export type FormExposed = DeconstructValue<_FormExposed>
