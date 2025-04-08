import type { FormComponentProps } from '@ui/types/component-common'
import { bem } from '@ui/utils'
import { pick } from 'cat-kit/fe'

/**
 * 获取表单项的属性
 * @param props 表单系列组件的属性
 * @returns
 */
export function getFormItemProps(props: FormComponentProps) {
  return pick(props, ['label', 'field', 'readonly', 'span', 'tips'])
}

export const formItemCls = bem('form-item')

export const formItemViewerCls = formItemCls.e('viewer')
