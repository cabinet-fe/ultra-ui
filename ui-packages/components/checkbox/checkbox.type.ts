/** 复选框组件属性 */
export interface CheckboxProps<Val extends boolean | string | number = boolean> {
  /** 是否选中 */
  modelValue?: Val
  /** 自定义真值 */
  trueValue?: Val
  /** 自定义假值 */
  falseValue?: Val
}

export interface CheckboxEmits<Val extends boolean | string | number = boolean> {
  (name: 'update:modelValue', value: Val): void
}

/** 复选框暴露的属性和方法 */
export interface CheckboxExposed {}
