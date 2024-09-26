import type { ColorType } from '@ui/types/component-common'
import type { MessageType } from '@ui/types/components/message'
import {
  CircleCheckFilled,
  InfoFilled,
  WarningFilled,
  CircleCloseFilled,
  QuestionFilled
} from 'icon-ultra'
import type { DefineComponent } from 'vue'

const typeIcons = {
  default: InfoFilled,
  info: QuestionFilled,
  success: CircleCheckFilled,
  warn: WarningFilled,
  error: CircleCloseFilled
}
export function getTypeIcon(type: MessageType, icon?: DefineComponent): DefineComponent {
  return (icon ?? typeIcons[type]) as any
}

const typeColors = {
  error: 'danger',
  warn: 'warning'
}

export function getTypeColor(type: MessageType): ColorType {
  return typeColors[type] ?? type
}
