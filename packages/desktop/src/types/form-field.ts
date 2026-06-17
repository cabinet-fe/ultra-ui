import type { FormComponentProps } from '@veltra/utils'

import type { ValidateRule } from '../components/form-item/validate'

export type { PresetRule, ValidateRule } from '../components/form-item/validate'

/** 带校验规则的表单控件通用属性 */
export interface FormFieldComponentProps extends FormComponentProps {
  /** 校验规则 */
  rules?: ValidateRule
}
