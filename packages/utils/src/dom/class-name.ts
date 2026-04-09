import { makeBEM, type BEMFactory } from '../helper/make-bem'
import { CLS_PREFIX } from '../shared/constants'

export const bem: BEMFactory<typeof CLS_PREFIX> = makeBEM(CLS_PREFIX)

export function addClass(el: HTMLElement, className: string | string[]): void {
  if (Array.isArray(className)) {
    className.forEach((c) => el.classList.add(c))
  } else {
    el.classList.add(className)
  }
}

export function removeClass(el: HTMLElement, className: string | string[]): void {
  if (Array.isArray(className)) {
    className.forEach((c) => el.classList.remove(c))
  } else {
    el.classList.remove(className)
  }
}
