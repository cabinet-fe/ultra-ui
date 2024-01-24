import type { BEM } from '@ui/utils'
import { shallowRef, watch, type ShallowRef } from 'vue'

interface Options {
  cls: BEM<'dialog'>
  dialogRef: ShallowRef<HTMLDivElement | undefined>
}

interface Returned {
  /** 是否为最大状态 */
  maximized: ShallowRef<boolean>
  /** 切换最大状态 */
  toggleMaximize: (maxim: boolean) => void
}

export function useMaximum(options: Options): Returned {
  const { cls, dialogRef } = options

  const maximized = shallowRef(false)
  const maximumCls = cls.m('maximum')

  watch(maximized, maximized => {
    const dom = dialogRef.value
    if (!dom) return
    if (maximized) {
      // 先设置一个高度才会有过渡动画

      const cssTexts = [
        `height: ${dom.offsetHeight}px`,
        'transition-property: width, height, transform',
        'transition-duration: 0.25s',

        'transition-timing-function: cubic-bezier(0.76, 0, 0.44, 1.3)'
      ]
      dom.style.cssText += cssTexts.join(';')

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dom.classList.add(maximumCls)
        })
      })
    } else {
      dom.classList.remove(maximumCls)

    }
  })
  /** 切换最大化 */
  const toggleMaximize = (maxim: boolean): void => {
    maximized.value = maxim
  }

  return {
    maximized,
    toggleMaximize
  }
}
