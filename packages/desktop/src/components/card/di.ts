import type { BEM } from '@veltra/utils'
import type { InjectionKey } from 'vue'

import type { CardProps } from '../../types'

export interface CardContext {
  cls: BEM<'card'>
  cardProps: CardProps
}

export const CardDIKey: InjectionKey<CardContext> = Symbol('CardDIKey')
