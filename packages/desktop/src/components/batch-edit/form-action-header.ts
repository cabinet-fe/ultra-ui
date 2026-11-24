import { AddChild, EditPen, Plus, View } from '@veltra/icons/normal'
import type { Component } from 'vue'

import type { BatchEditStates } from '../../types'

export interface FormActionHeaderInfo {
  icon: Component
  title: string
}

export const FORM_ACTION_HEADER_MAP: Record<
  BatchEditStates['formActionType'],
  FormActionHeaderInfo
> = {
  create: { icon: Plus, title: '新增' },
  update: { icon: EditPen, title: '编辑' },
  view: { icon: View, title: '查看详情' },
  createChild: { icon: AddChild, title: '新增子级' }
}
