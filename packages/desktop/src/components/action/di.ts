import type { InjectionKey } from 'vue'

import type { ActionGroupProps } from '../../types'

export const ActionDIKey: InjectionKey<{ groupProps: ActionGroupProps; closeTip: () => void }> =
  Symbol('ActionDIKey')
