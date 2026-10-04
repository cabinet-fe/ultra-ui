import type { MaybeRefOrGetter, ModelRef } from 'vue'
import { computed, onScopeDispose, toValue, watch } from 'vue'

export interface UseCarouselOptions {
  /** 当前页索引，v-model:active-index */
  model: ModelRef<number>
  /** 页数，取已注册页数量 */
  count: MaybeRefOrGetter<number>
  /** 是否自动播放 */
  autoplay: MaybeRefOrGetter<boolean>
  /** 自动播放间隔（毫秒） */
  interval: MaybeRefOrGetter<number>
  /** 是否循环切换 */
  loop: MaybeRefOrGetter<boolean>
}

/**
 * 走马灯索引与自动播放计时：
 * - `goTo` 把目标索引收敛到 `[0, 页数)`，越界按取模回绕
 * - `prev` / `next` 单步切换，循环时回绕，非循环时停在边界
 * - 自动播放开关、间隔、页数、当前页任一变化后重置计时，手动切换同样重新计时
 */
export function useCarousel({ model, count, autoplay, interval, loop }: UseCarouselOptions) {
  const pageCount = () => Math.max(toValue(count), 0)

  /** 展示索引：外部传入越界值时收敛到页数范围内，避免轨道滑出空白 */
  const current = computed(() => {
    const total = pageCount()
    if (total <= 0) return 0
    return Math.min(Math.max(model.value, 0), total - 1)
  })

  const goTo = (index: number) => {
    const total = pageCount()
    if (total <= 0) return
    const next = ((index % total) + total) % total
    if (next !== model.value) model.value = next
  }

  const step = (direction: 1 | -1) => {
    const total = pageCount()
    if (total <= 1) return
    const target = current.value + direction
    if (toValue(loop)) {
      goTo(target)
      return
    }
    if (target >= 0 && target < total) goTo(target)
  }

  const canPrev = computed(() => toValue(loop) || current.value > 0)
  const canNext = computed(() => toValue(loop) || current.value < pageCount() - 1)

  const prev = () => step(-1)
  const next = () => step(1)

  let timer: ReturnType<typeof setInterval> | undefined

  const stopAutoplay = () => {
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
  }

  const startAutoplay = () => {
    stopAutoplay()
    if (!toValue(autoplay) || pageCount() < 2) return
    timer = setInterval(() => step(1), toValue(interval))
  }

  watch([autoplay, count, interval, current], startAutoplay)

  onScopeDispose(stopAutoplay)

  return { current, canPrev, canNext, goTo, prev, next }
}
