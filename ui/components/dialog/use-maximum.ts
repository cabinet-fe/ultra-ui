import { useTransition } from '@ui/compositions'
import { type BEM, removeStyles, setStyles } from '@ui/utils'
import { shallowRef, type ShallowRef } from 'vue'

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

// 最大化过程
// 1. 先设置一个高度才会有过渡动画
// 2. 在下一个帧应用最大化时的类名
// 3. 在进入动画结束时移除高度

export function useMaximum(options: Options): Returned {
  const { dialogRef } = options

  const maximized = shallowRef(false)

  const maximizeTransition = useTransition('css', {
    target: dialogRef,
    name: 'dialog-maximize',
    keepEnterTo: true,
    afterLeave() {
      dialogRef.value && removeStyles(dialogRef.value, ['height'])
    }
  })

  /** 切换最大化 */
  const toggleMaximize = (maxim: boolean): void => {
    maximized.value = maxim
    const dom = dialogRef.value
    if (!dom) return
    if (maxim) {
      // 先设置一个高度才会有过渡动画
      setStyles(dom, { height: `${dom.offsetHeight}px` })
      maximizeTransition.enter()
    } else {
      maximizeTransition.leave()
    }
  }

  return {
    maximized,
    toggleMaximize
  }
}
