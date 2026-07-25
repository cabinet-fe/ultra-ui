import { createToggle } from '@veltra/utils'
import { isRef, onBeforeUnmount, computed } from 'vue'

import type { Returned, CssTransitionOptions } from './type'

/** 解析 CSS 时间值（s / ms）为毫秒 */
const parseTime = (time: string): number => {
  const t = time.trim()
  if (t.endsWith('ms')) return parseFloat(t)
  return parseFloat(t) * 1000
}

/**
 * 使用css过渡
 *
 * 阶段结束不依赖 transitionend 事件：进入/离开相互打断时类共存会导致
 * 过渡不触发、end 事件丢失从而卡死。这里每个阶段开始时清理相反阶段的类，
 * 并以「计算过渡耗时 + 定时器」兜底，保证阶段必然终结。
 *
 * @param options 过渡选项
 */
export function useCssTransition(options: CssTransitionOptions): Returned {
  const { name, target, afterEnter, afterLeave, keepEnterTo = false } = options

  const getDom = (): HTMLElement | undefined => (isRef(target) ? target.value : target)

  const classes = computed(() => {
    const _name = typeof name === 'string' ? name : name.value
    return {
      /** 进入前的类 */
      enterFrom: `${_name}-enter-from`,
      /** 进入后最终的类 */
      enterTo: `${_name}-enter-to`,
      /** 【进入动画】持续时的类 */
      enterActive: `${_name}-enter-active`,
      /** 离开前的类 */
      leaveFrom: `${_name}-leave-from`,
      /** 离开类 */
      leaveTo: `${_name}-leave-to`,
      /** 【离开动画】持续时的类 */
      leaveActive: `${_name}-leave-active`
    }
  })

  /** 阶段序号，使过期的 rAF / 定时器回调失效 */
  let phaseSeq = 0

  let finalizeTimer: ReturnType<typeof setTimeout> | undefined

  const clearFinalizeTimer = () => {
    if (finalizeTimer === undefined) return
    clearTimeout(finalizeTimer)
    finalizeTimer = undefined
  }

  /** 目标元素当前应用的最长过渡耗时（时长 + 延迟），无过渡则为 0 */
  const getTransitionDuration = (dom: HTMLElement): number => {
    const { transitionDuration, transitionDelay } = getComputedStyle(dom)
    const durations = transitionDuration.split(',').map(parseTime)
    const delays = transitionDelay.split(',').map(parseTime)
    return durations.reduce((max, d, i) => {
      return Math.max(max, d + (delays[i] ?? delays[delays.length - 1] ?? 0))
    }, 0)
  }

  /** 阶段完成：清理类并触发回调，仅当前阶段的定时器生效 */
  const finalize = (seq: number, entering: boolean) => {
    if (seq !== phaseSeq) return

    const dom = getDom()
    const { enterActive, enterTo, leaveActive, leaveTo } = classes.value

    if (entering) {
      if (keepEnterTo) {
        dom?.classList.remove(enterActive)
      } else {
        dom?.classList.remove(enterActive, enterTo)
      }
      afterEnter?.()
    } else {
      dom?.classList.remove(leaveActive, leaveTo)
      afterLeave?.()
    }
  }

  /** 过渡开始后调度兜底完成（晚 50ms 容错） */
  const scheduleFinalize = (seq: number, entering: boolean) => {
    clearFinalizeTimer()
    const dom = getDom()
    const duration = dom ? getTransitionDuration(dom) : 0
    finalizeTimer = setTimeout(() => finalize(seq, entering), duration + 50)
  }

  /** 开始进入动画 */
  const startTransitionIn = () => {
    const seq = ++phaseSeq
    const { enterActive, enterTo, enterFrom, leaveFrom, leaveActive, leaveTo } = classes.value
    const dom = getDom()

    // 清理离开阶段的残留类，避免与进入类共存导致过渡失效
    dom?.classList.remove(leaveFrom, leaveActive, leaveTo)
    dom?.classList.add(enterFrom)

    requestAnimationFrame(() => {
      if (seq !== phaseSeq) return
      dom?.classList.add(enterActive)
      requestAnimationFrame(() => {
        if (seq !== phaseSeq) return
        dom?.classList.remove(enterFrom)
        dom?.classList.add(enterTo)
        scheduleFinalize(seq, true)
      })
    })
  }

  /** 开始离开动画 */
  const startTransitionOut = () => {
    const seq = ++phaseSeq
    const { leaveTo, leaveActive, leaveFrom, enterFrom, enterActive, enterTo } = classes.value
    const dom = getDom()

    // 清理进入阶段的残留类，避免与离开类共存导致过渡失效
    dom?.classList.remove(enterFrom, enterActive, enterTo)
    dom?.classList.add(leaveFrom, leaveActive)

    requestAnimationFrame(() => {
      if (seq !== phaseSeq) return
      requestAnimationFrame(() => {
        if (seq !== phaseSeq) return
        dom?.classList.remove(leaveFrom)
        dom?.classList.add(leaveTo)
        scheduleFinalize(seq, false)
      })
    })
  }

  const [, toggle] = createToggle(false, (_active) => {
    _active ? startTransitionIn() : startTransitionOut()
  })

  onBeforeUnmount(() => {
    clearFinalizeTimer()
  })

  return {
    toggle,
    enter() {
      toggle(true)
    },
    leave() {
      toggle(false)
    }
  }
}
