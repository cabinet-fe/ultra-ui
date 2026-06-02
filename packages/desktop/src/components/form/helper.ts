import type { FormModelItem } from '../../types'

/**
 * 定义表单项
 * @param item 表单项
 * @returns
 */
export function formField<Val = unknown>(item?: FormModelItem<Val>): FormModelItem<Val> {
  if (!item) {
    return {}
  }

  return item
}

export interface NestedFieldMarker<T extends Record<string, any> = Record<string, any>> {
  __isNested: true
  fields: T
}

export function nestField<T extends Record<string, any>>(fields: T): NestedFieldMarker<T> {
  return { __isNested: true, fields }
}
