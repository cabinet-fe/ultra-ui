import type { ColorType, MessageType } from '../../types'
import { CircleCheckFilled, CircleClose, InfoFilled, QuestionFilled, WarningFilled } from '@ultra-ui/icons/normal'
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
