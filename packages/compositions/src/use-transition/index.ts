import type { Returned, CssTransitionOptions, StyleTransitionOptions } from './type'
import { useCssTransition } from './use-css-transition'
import { useStyleTransition } from './use-style-transition'

export function useTransition(type: 'css', options: CssTransitionOptions): Returned
export function useTransition(type: 'style', options: StyleTransitionOptions): Returned
export function useTransition(type: string, options: any): Returned {
  if (type === 'css') {
    return useCssTransition(options)
  }
  return useStyleTransition(options)
}
