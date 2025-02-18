import { CLS_PREFIX } from '@ui/shared'
import { makeBEM } from '../helper/make-bem'

export const bem = makeBEM(CLS_PREFIX)

export function addClass(el: HTMLElement, className: string | string[]) {
  if (Array.isArray(className)) {
    className.forEach(c => el.classList.add(c))
  } else {
    el.classList.add(className)
  }
}

export function removeClass(el: HTMLElement, className: string | string[]) {
  if (Array.isArray(className)) {
    className.forEach(c => el.classList.remove(c))
  } else {
    el.classList.remove(className)
  }
}
