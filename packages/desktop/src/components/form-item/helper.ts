import { o } from '@cat-kit/core'
import { bem, type BEM, type FormComponentProps } from '@veltra/utils'

/**
 * 获取表单项的属性
 * @param props 表单系列组件的属性
 * @returns
 */
export function getFormItemProps(
  props: FormComponentProps
): Pick<FormComponentProps, 'label' | 'field' | 'readonly' | 'span' | 'tips'> {
  return o(props).pick(['label', 'field', 'readonly', 'span', 'tips']) as Pick<
    FormComponentProps,
    'label' | 'field' | 'readonly' | 'span' | 'tips'
  >
}

export const formItemCls: BEM<'form-item'> = bem('form-item')
