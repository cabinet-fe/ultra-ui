import type { BEM } from '@ui/utils'
import { shallowRef, watch, type ShallowRef } from 'vue'

interface Options {
  cls: BEM<'dialog'>
  dialogRef: ShallowRef<HTMLDivElement | undefined>
}

interface Returned {
  maximized: ShallowRef<boolean>
  toggleMaximize: () => void
}

export function useMaximum(options: Options): Returned {
  const { cls, dialogRef } = options

  const maximized = shallowRef(false)
  const maximumCls = cls.m('maximum')
  watch(maximized, maximized => {
    const dom = dialogRef.value
    if (!dom) return
    if (maximized) {
      dom.style.height = dom.offsetHeight + 'px'
      requestAnimationFrame(() => {
        dom.classList.add(maximumCls)
      })
    } else {
      requestAnimationFrame(() => {
        dom.classList.remove(maximumCls)
      })
    }
  })
  /** 切换最大化 */
  const toggleMaximize = (): void => {
    maximized.value = !maximized.value
  }

  return {
    maximized,
    toggleMaximize
  }
}
