import type { ColorType, ComponentSize } from '@veltra/utils'

export interface TagProps {
  type?: ColorType
  closable?: boolean
  size?: ComponentSize
  round?: boolean
  dark?: boolean
}

export interface TagEmits {
  (e: 'close'): void
}
export interface TagExposed {}
