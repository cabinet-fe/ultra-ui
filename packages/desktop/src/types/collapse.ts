import type { ComponentProps } from '@veltra/utils'

export type CollapseModelValue = string | string[] | number | number[]

/** Collapse component props */
export interface CollapseProps extends ComponentProps {
  /** The currently active panel value(s) */
  modelValue?: CollapseModelValue

  /** If true, only one panel can be open at a time */
  accordion?: boolean
}

export interface CollapseEmits {
  (e: 'update:modelValue', value: CollapseModelValue): void
  (e: 'change', value: CollapseModelValue): void
}

/** CollapseItem component props */
export interface CollapseItemProps extends ComponentProps {
  /** Unique identifier for the item */
  value: string | number

  /** The title text to display in the header */
  title?: string

  /** If true, the item cannot be toggled */
  disabled?: boolean
}
