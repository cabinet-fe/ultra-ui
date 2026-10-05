import type { ComponentProps, DeconstructValue } from '@veltra/utils'
import type { ShallowRef } from 'vue'

/** 表单组件属性 */
export interface FormProps extends ComponentProps {
  /**
   * 自定义表单列数
   * - 移动端单列呈现，该属性不生效
   */
  cols?: number
  /** 分组标题：渲染在卡片列表顶部，与 #header 插槽二选一，插槽优先 */
  title?: string
  /** 表单数据 */
  model?: Record<string, any>
  /** 开启后，字段当前值与基准值不同时，在控件下方展示「变更前」 */
  showModified?: boolean
  /** 「变更前」标签文案，默认「变更前：」 */
  modifiedLabel?: string
  /** 变更前基准数据；未传时回退到 model 引用首次传入时的快照（与 reset 一致） */
  initialModel?: Record<string, any>
  /**
   * 表单项 label 宽度
   * - number 单位 px；传了该值各行 label 固定宽对齐
   * - 未传时 label 按内容自适应宽度（移动端默认）
   */
  labelWidth?: string | number
  /** 表单项 label 位置；默认 'left' 行式（label 左、控件右），'top' 时 label 在控件上方 */
  labelPosition?: 'top' | 'left'
  /** 是否不显示tips */
  noTips?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否禁用 */
  disabled?: boolean
}

/** 表单组件定义的事件 */
export interface FormEmits {
  /** model 字段值更新，含编程写入 */
  (e: 'field:update', field: string, value: any): void
}

/** 表单暴露的属性和方法(组件内部使用) */
export interface _FormExposed {
  el: ShallowRef<HTMLElement | null | undefined>
  /** 校验指定字段，未传 keys 时校验全部已注册字段 */
  validate: (keys?: string[]) => Promise<boolean>
  clearValidate: () => void
  /** 将 model 恢复为最近一次 props.model 引用变更时的快照，并清除校验 */
  reset: () => void
}

/** 表单暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type FormExposed = DeconstructValue<_FormExposed>
