import type { BEM } from '@ui/utils'
import type { InjectionKey } from 'vue'
import type { CardProps } from '@ui/types/components/card'

export interface CardContext {
  cls: BEM<'card'>
  cardProps: CardProps
}

export const CardDIKey: InjectionKey<CardContext> = Symbol('CardDIKey')
