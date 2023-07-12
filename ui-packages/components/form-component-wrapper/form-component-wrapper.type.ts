import { Component, VNode } from "vue"

/** 表单组件包装器组件属性 */
export interface FormComponentWrapperProps {
  /** 在表单内部作为表单项label */
  label?: string;
  /** 在表单内部和表单数据绑定的属性 */
  prop?: string
  /** 表单项的提示, 可以是字符串, 虚拟dom, vue组件 */
  tips?: string | VNode | Component
}
