<template>
  <slot />
</template>

<script lang="ts" setup>
import { onBeforeUnmount, watch } from 'vue'

defineOptions({ name: 'UFileViewerPdfViewportScroll' })

const props = defineProps<{
  /** 滚动视口容器，由 pdf-previewer 以模板 ref 传入 */
  viewport: HTMLDivElement | null
}>()

let panState:
  | { pointerId: number; startX: number; startY: number; scrollLeft: number; scrollTop: number }
  | undefined

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return !!target.closest(
    'button, a, input, textarea, select, video, [contenteditable="true"], .u-scroll__bar-x, .u-scroll__bar-y'
  )
}

function handlePointerDown(e: PointerEvent) {
  if (e.button !== 0 || isInteractiveTarget(e.target)) return

  const el = props.viewport
  if (!el) return

  panState = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    scrollLeft: el.scrollLeft,
    scrollTop: el.scrollTop
  }
  el.classList.add('is-panning')
  el.setPointerCapture(e.pointerId)
  e.preventDefault()
}

function handlePointerMove(e: PointerEvent) {
  if (!panState || panState.pointerId !== e.pointerId) return

  const el = props.viewport
  if (!el) return

  el.scrollLeft = panState.scrollLeft - (e.clientX - panState.startX)
  el.scrollTop = panState.scrollTop - (e.clientY - panState.startY)
}

function endPan(e: PointerEvent) {
  if (!panState || panState.pointerId !== e.pointerId) return

  const el = props.viewport
  if (el?.hasPointerCapture(e.pointerId)) {
    el.releasePointerCapture(e.pointerId)
  }
  el?.classList.remove('is-panning')
  panState = undefined
}

let detachPan: (() => void) | undefined

watch(
  () => props.viewport,
  (el, _, onCleanup) => {
    detachPan?.()
    detachPan = undefined
    if (!el) return

    el.addEventListener('pointerdown', handlePointerDown, { capture: true })
    el.addEventListener('pointermove', handlePointerMove, { capture: true })
    el.addEventListener('pointerup', endPan, { capture: true })
    el.addEventListener('pointercancel', endPan, { capture: true })

    detachPan = () => {
      el.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      el.removeEventListener('pointermove', handlePointerMove, { capture: true })
      el.removeEventListener('pointerup', endPan, { capture: true })
      el.removeEventListener('pointercancel', endPan, { capture: true })
      el.classList.remove('is-panning')
      panState = undefined
    }

    onCleanup(() => {
      detachPan?.()
      detachPan = undefined
    })
  },
  { immediate: true, flush: 'post' }
)

onBeforeUnmount(() => {
  detachPan?.()
  detachPan = undefined
})
</script>
