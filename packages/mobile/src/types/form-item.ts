import type { FormComponentProps } from '@veltra/utils'

/** 表单项组件属性 */
export interface FormItemProps extends FormComponentProps {
  /**
   * 标签宽度
   * - number 单位 px；传了该值（自身或 UForm）label 用固定宽对齐
   * - 都未传时 label 按内容自适应宽度（移动端默认）
   */
  labelWidth?: string | number
  /** 标签位置；默认 'left' 行式（label 左、控件右），'top' 时 label 在控件上方 */
  labelPosition?: 'top' | 'left'
}

/** 表单项组件定义的事件 */
export interface FormItemEmits {
  /** 内部控件 change，参数与控件一致 */
  (e: 'change', ...args: any[]): void
}

/** 表单项组件暴露的属性和方法 */
export interface FormItemExposed {}
