import type { FormComponentProps } from '@ultra-ui/utils/types'
import { bem, type BEM } from '@ultra-ui/utils'
import { pick } from '@ultra-ui/utils'

/**
 * 获取表单项的属性
 * @param props 表单系列组件的属性
 * @returns
 */
export function getFormItemProps(
  props: FormComponentProps
): Pick<FormComponentProps, 'label' | 'field' | 'readonly' | 'span' | 'tips'> {
  return pick(props, ['label', 'field', 'readonly', 'span', 'tips'])
}

export const formItemCls: BEM<'form-item'> = bem('form-item')
