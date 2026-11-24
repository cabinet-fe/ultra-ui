import { o } from '@cat-kit/core'
import { bem, type BEM, type FormComponentProps, type FormFieldItem } from '@veltra/utils'

export function getFormItemProps(
  props: FormComponentProps
): Pick<FormComponentProps, 'label' | 'field' | 'readonly' | 'span' | 'tips'> {
  return o(props).pick(['label', 'field', 'readonly', 'span', 'tips']) as Pick<
    FormComponentProps,
    'label' | 'field' | 'readonly' | 'span' | 'tips'
  >
}

export const formItemCls: BEM<'form-item'> = bem('form-item')

export function defineField(field: FormFieldItem) {
  return field
}
