import type { ColorType, MessageType } from '@ultra-ui/pc/types'
import {
  AlertTriangle,
  CircleCheck,
  CircleHelp,
  CircleX,
  Info
} from '@lucide/vue'
import type { DefineComponent } from 'vue'

const typeIcons = {
  default: Info,
  info: CircleHelp,
  success: CircleCheck,
  warn: AlertTriangle,
  error: CircleX
}
export function getTypeIcon(
  type: MessageType,
  icon?: DefineComponent
): DefineComponent {
  return (icon ?? typeIcons[type]) as any
}

const typeColors: Partial<Record<MessageType, ColorType>> = {
  error: 'danger',
  warn: 'warning'
}

export function getTypeColor(type: MessageType): ColorType {
  return typeColors[type] ?? (type as ColorType)
}
