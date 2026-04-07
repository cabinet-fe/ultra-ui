import type { BEM } from '@ultra-ui/utils'
import type { InjectionKey } from 'vue'
import type { CardProps } from '@ultra-ui/desktop/types'

export interface CardContext {
  cls: BEM<'card'>
  cardProps: CardProps
}

export const CardDIKey: InjectionKey<CardContext> = Symbol('CardDIKey')
