import { AddChild, EditPen, Plus, View } from '@veltra/icons/normal'
import type { Component } from 'vue'

import type { BatchEditStates } from '../../types'

/** 表单操作类型对应的头部展示信息 */
export interface FormActionHeaderInfo {
  icon: Component
  title: string
}

/** 按 formActionType 映射的表单头部信息 */
export const FORM_ACTION_HEADER_MAP: Record<
  BatchEditStates['formActionType'],
  FormActionHeaderInfo
> = {
  create: { icon: Plus, title: '新增' },
  update: { icon: EditPen, title: '编辑' },
  view: { icon: View, title: '查看详情' },
  createChild: { icon: AddChild, title: '新增子级' }
}
