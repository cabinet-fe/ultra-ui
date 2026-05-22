<template>
  <!-- EmbedPDF Viewport 自带滚动；u-scroll 仅同步自定义滚动条 -->
  <u-scroll :target="viewportEl">
    <slot />
  </u-scroll>
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeUnmount, type Ref, watch } from 'vue'

import { UScroll } from '../../scroll'

defineOptions({ name: 'FileViewerPdfViewportScroll' })

/** EmbedPDF Viewport 向子树注入的滚动容器 ref */
const VIEWPORT_ELEMENT_KEY = 'viewport-element'

const viewportRef = inject<Ref<HTMLDivElement | null>>(VIEWPORT_ELEMENT_KEY)
const viewportEl = computed(() => viewportRef?.value ?? null)

let panState:
  | {
      pointerId: number
      startX: number
      startY: number
      scrollLeft: number
      scrollTop: number
    }
  | undefined

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return !!target.closest(
    'button, a, input, textarea, select, video, [contenteditable="true"], .u-scroll__bar-x, .u-scroll__bar-y'
  )
}

function handlePointerDown(e: PointerEvent) {
  if (e.button !== 0 || isInteractiveTarget(e.target)) return

  const el = viewportEl.value
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

  const el = viewportEl.value
  if (!el) return

  el.scrollLeft = panState.scrollLeft - (e.clientX - panState.startX)
  el.scrollTop = panState.scrollTop - (e.clientY - panState.startY)
}

function endPan(e: PointerEvent) {
  if (!panState || panState.pointerId !== e.pointerId) return

  const el = viewportEl.value
  if (el?.hasPointerCapture(e.pointerId)) {
    el.releasePointerCapture(e.pointerId)
  }
  el?.classList.remove('is-panning')
  panState = undefined
}

let detachPan: (() => void) | undefined

watch(
  viewportEl,
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
  { immediate: true }
)

onBeforeUnmount(() => {
  detachPan?.()
  detachPan = undefined
})
</script>
