import type { ActionGroupProps } from '../../types'
import type { InjectionKey } from 'vue'

export const ActionDIKey: InjectionKey<{
  groupProps: ActionGroupProps
}> = Symbol('ActionDIKey')
