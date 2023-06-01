import { FormComponentProps } from '@ui/shared'

/** 表单组件属性 */
export interface FormProps extends FormComponentProps {
  /** 表单模式, edit为编辑模式, view为查看模式 */
  mode?: 'edit' | 'view'

}