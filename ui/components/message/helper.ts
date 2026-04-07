import type { ColorType, MessageType } from '@ui/types'
import {
  CircleCheckFilled,
  InfoFilled,
  WarningFilled,
  CircleClose,
  QuestionFilled
} from '@ultra/icon'
import type { DefineComponent } from 'vue'

const typeIcons = {
  default: InfoFilled,
  info: QuestionFilled,
  success: CircleCheckFilled,
  warn: WarningFilled,
  error: CircleClose
}
export function getTypeIcon(
  type: MessageType,
  icon?: DefineComponent
): DefineComponent {
  return (icon ?? typeIcons[type]) as any
}

const typeColors = {
  error: 'danger',
  warn: 'warning'
}

export function getTypeColor(type: MessageType): ColorType {
  return typeColors[type] ?? type
}
