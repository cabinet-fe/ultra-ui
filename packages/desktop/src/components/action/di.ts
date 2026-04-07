import type { ActionGroupProps } from '@ultra-ui/desktop/types'
import type { InjectionKey } from 'vue'

export const ActionDIKey: InjectionKey<{
  groupProps: ActionGroupProps
}> = Symbol('ActionDIKey')
