import type {
  Returned,
  CssTransitionOptions,
  StyleTransitionOptions
} from './type'
import { useCssTransition } from './use-css-transition'
import { useStyleTransition } from './use-style-transition'

/**
 * 使用CSS类过渡
 * @param type 过渡类型
 * @param options 过渡选项
 */
export function useTransition(
  type: 'css',
  options: CssTransitionOptions
): Returned
/**
 * 使用style样式过渡
 * @param type 过渡类型
 * @param options 过渡选项
 */
export function useTransition(
  type: 'style',
  options: StyleTransitionOptions
): Returned
export function useTransition(type: 'css' | 'style', options: any): Returned {
  if (type === 'css') {
    return useCssTransition(options)
  }
  return useStyleTransition(options)
}
