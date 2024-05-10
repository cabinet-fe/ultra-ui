import type { ValidateRule } from '@ui/types/utils/form/validate'

interface FormModelItem<Val = unknown> extends ValidateRule {
  value?: Val
}

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
