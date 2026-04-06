import type { FormModelItem } from '@ui/types'

/**
 * 定义表单项
 * @param item 表单项
 * @returns
 */
export function formField<Val = unknown>(
  item?: FormModelItem<Val>
): FormModelItem<Val> {
  if (!item) {
    return {}
  }

  return item
}
