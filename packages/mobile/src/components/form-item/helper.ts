import { type FormFieldItem } from '@veltra/utils'

import { bem, type MobileBEM } from '../../shared/bem'

export const formItemCls: MobileBEM<'form-item'> = bem('form-item')

export function defineField(field: FormFieldItem) {
  return field
}
