import type { BEM } from '@ultra-ui/core'
import type { InjectionKey } from 'vue'
import type { CardProps } from '@ultra-ui/pc/types'

export interface CardContext {
  cls: BEM<'card'>
  cardProps: CardProps
}

export const CardDIKey: InjectionKey<CardContext> = Symbol('CardDIKey')
