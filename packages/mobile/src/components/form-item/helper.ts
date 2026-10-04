import { bem, type BEM, type FormFieldItem } from '@veltra/utils'

export const formItemCls: BEM<'form-item'> = bem('form-item')

export function defineField(field: FormFieldItem) {
  return field
}
