import type { FormComponentProps } from "@ui/shared"
import { pick } from "cat-kit/fe"

/**
 * 获取表单项的属性
 * @param props 表单系列组件的属性
 * @returns
 */
export function getFormItemProps(props: FormComponentProps) {
  return pick(props, ['label', 'field', 'readonly', 'span', 'tips'])
}