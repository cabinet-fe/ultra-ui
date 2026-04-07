import type { FormComponentProps } from '@ui/types/component-common'
import { bem, type BEM } from '@ui/utils'
import { pick } from 'cat-kit/fe'

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
