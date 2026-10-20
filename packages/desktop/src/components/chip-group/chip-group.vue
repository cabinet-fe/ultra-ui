<template>
  <div v-if="!readonly" v-bind="$attrs" :class="[cls.b, cls.m(size)]">
    <div
      ref="viewport"
      :class="[
        cls.e('viewport'),
        bem.is('mask-start', overflowStart),
        bem.is('mask-end', overflowEnd),
        bem.is('dragging', dragging)
      ]"
      @scroll.passive="updateOverflow"
      @pointerdown="onPointerDown"
      @click.capture="onClickCapture"
      @keydown="onKeyDown"
      @focusin="onFocusIn"
    >
      <div ref="track" :class="cls.e('track')" role="radiogroup" aria-orientation="horizontal">
        <u-chip
          v-for="(item, index) of items"
          :key="item[valueKey]"
          :data-index="index"
          :name="groupName"
          :value="item[valueKey]"
          :model-value="model"
          @update:model-value="handleUpdate($event, item)"
          :disabled="disabledItem?.(item) || disabled"
          :size="size"
        >
          {{ item[labelKey] }}
        </u-chip>
      </div>
    </div>
  </div>

  <template v-else>
    {{ items.find((item) => item[valueKey] === model)?.[labelKey] || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { useFormFallbackProps, useResizeObserver } from '@veltra/compositions'
import { bem, fieldKey, FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import {
  computed,
  nextTick,
  onScopeDispose,
  ref,
  shallowRef,
  useId,
  useTemplateRef,
  watch
} from 'vue'

import type { ChipGroupEmits, ChipGroupProps } from '../../types'
import UChip from '../chip/chip.vue'
import {
  CHIP_EDGE_FADE,
  chipOverflowState,
  chipRevealMetrics,
  chipRevealScroll,
  chipWheelScroll,
  isChipClear,
  scrollViewportTo
} from './reveal'

defineOptions({ name: 'UChipGroup', inheritAttrs: false })

const props = defineProps<ChipGroupProps>()

const model = defineModel<any>()

const emit = defineEmits<ChipGroupEmits>()

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const cls = bem('chip-group')
const groupName = useId()
const viewportRef = useTemplateRef('viewport')
const trackRef = useTemplateRef('track')
const overflowStart = ref(false)
const overflowEnd = ref(false)
const dragging = shallowRef(false)

/** 小于这个位移仍算点击。进度节点没有阈值，纸片一点就选中，所以拖动必须先离开点击。 */
const DRAG_SLOP = 4
let dragPointer = -1
let dragOriginX = 0
let dragOriginScroll = 0
let dragMoved = false
let suppressClick = false

const labelKey = computed(() => fieldKey(props.labelKey, 'label'))
const valueKey = computed(() => fieldKey(props.valueKey, 'value'))

let activateToken = 0

useResizeObserver({ targets: [viewportRef, trackRef], onResize: () => updateOverflow() })

watch(
  () => props.items.length,
  () => {
    nextTick(updateOverflow)
  }
)

watch(readonly, () => {
  nextTick(updateOverflow)
})

function updateOverflow() {
  const viewport = viewportRef.value
  if (!viewport) return
  const overflow = chipOverflowState(
    viewport.scrollLeft,
    viewport.clientWidth,
    viewport.scrollWidth
  )
  overflowStart.value = overflow.start
  overflowEnd.value = overflow.end
}

function onWheel(event: WheelEvent) {
  const viewport = viewportRef.value
  if (!viewport) return
  const next = chipWheelScroll(
    viewport.scrollLeft,
    viewport.clientWidth,
    viewport.scrollWidth,
    event.deltaX,
    event.deltaY
  )
  if (!next) return
  const moved = Math.abs(next.left - viewport.scrollLeft) >= 1
  if (moved) {
    viewport.scrollLeft = next.left
    event.preventDefault()
  }
  if (Math.abs(next.leftover) < 1) return
  // overflow-y: hidden 会吃掉滚轮，不 preventDefault 页面也不会接着滚。
  if (scrollParentByWheel(viewport, next.leftover)) event.preventDefault()
}

function scrollParentByWheel(viewport: HTMLElement, deltaY: number) {
  let parent = viewport.parentElement
  let moved = false
  while (parent && Math.abs(deltaY) >= 1) {
    const overflowY = getComputedStyle(parent).overflowY
    const canScroll =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      parent.scrollHeight > parent.clientHeight + 1
    if (canScroll) {
      const before = parent.scrollTop
      const max = parent.scrollHeight - parent.clientHeight
      parent.scrollTop = Math.min(max, Math.max(0, before + deltaY))
      const used = parent.scrollTop - before
      if (Math.abs(used) >= 1) moved = true
      deltaY -= used
    }
    parent = parent.parentElement
  }
  return moved
}

watch(viewportRef, (viewport, previous) => {
  previous?.removeEventListener('wheel', onWheel)
  viewport?.addEventListener('wheel', onWheel, { passive: false })
})

onScopeDispose(() => {
  viewportRef.value?.removeEventListener('wheel', onWheel)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
})

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || event.pointerType === 'touch') return
  const viewport = viewportRef.value
  if (!viewport) return
  const { maxScroll } = chipOverflowState(
    viewport.scrollLeft,
    viewport.clientWidth,
    viewport.scrollWidth
  )
  if (maxScroll <= 1) return
  suppressClick = false
  dragPointer = event.pointerId
  dragOriginX = event.clientX
  dragOriginScroll = viewport.scrollLeft
  dragMoved = false
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerId !== dragPointer) return
  const viewport = viewportRef.value
  if (!viewport) return
  const dx = event.clientX - dragOriginX
  if (!dragMoved) {
    if (Math.abs(dx) < DRAG_SLOP) return
    dragMoved = true
    dragging.value = true
    viewport.setPointerCapture?.(event.pointerId)
  }
  viewport.scrollLeft = dragOriginScroll - dx
}

function endDrag(event: PointerEvent) {
  if (event.pointerId !== dragPointer) return
  const viewport = viewportRef.value
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
  dragPointer = -1
  if (dragMoved) suppressClick = true
  dragMoved = false
  dragging.value = false
  if (viewport?.hasPointerCapture?.(event.pointerId))
    viewport.releasePointerCapture(event.pointerId)
}

function chipFromEvent(target: EventTarget | null) {
  if (!(target instanceof Element)) return
  const chip = target.closest<HTMLElement>('.u-chip')
  if (!chip || !viewportRef.value?.contains(chip)) return
  return chip
}

function handleUpdate(value: any, item: Record<string, any>) {
  model.value = value
  emit('change', item)
}

function reveal(chip: HTMLElement) {
  const viewport = viewportRef.value
  if (!viewport) return Promise.resolve()
  const metrics = chipRevealMetrics(chip, viewport, CHIP_EDGE_FADE)
  // 连续方向键时 smooth scrollTo 会被浏览器丢掉，纸片停在视口外。这里直接滚到位。
  return scrollViewportTo(viewport, chipRevealScroll(metrics), 'auto').then(updateOverflow)
}

function onFocusIn(event: FocusEvent) {
  const chip = chipFromEvent(event.target)
  if (!chip || chip.classList.contains('is-disabled')) return
  const viewport = viewportRef.value
  if (!viewport) return
  const metrics = chipRevealMetrics(chip, viewport, CHIP_EDGE_FADE)
  if (isChipClear(metrics)) return
  void reveal(chip)
}

function selectChip(chip: HTMLElement) {
  const item = props.items[Number(chip.dataset.index)]
  if (!item) return
  const value = item[valueKey.value]
  if (model.value === value) return
  handleUpdate(value, item)
}

function focusChip(chip: HTMLElement) {
  chip.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
}

function onKeyDown(event: KeyboardEvent) {
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
  const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
  if (!forward && !backward) return

  const current = chipFromEvent(event.target)
  const viewport = viewportRef.value
  if (!current || !viewport) return

  const chips = [...viewport.querySelectorAll<HTMLElement>('.u-chip')].filter(
    (chip) => !chip.classList.contains('is-disabled')
  )
  const index = chips.indexOf(current)
  if (index < 0 || chips.length < 2) return

  // 滚动会改遮罩并重渲染。若交给原生 radio 改选中，重渲染会用旧 model 把选中态写回去。
  event.preventDefault()
  const next = chips[(index + (forward ? 1 : -1) + chips.length) % chips.length]!
  selectChip(next)
  focusChip(next)
  void reveal(next)
}

function onClickCapture(event: MouseEvent) {
  if (suppressClick) {
    suppressClick = false
    event.preventDefault()
    event.stopPropagation()
    return
  }
  if (event.button !== 0) return
  const chip = chipFromEvent(event.target)
  if (!chip || chip.classList.contains('is-disabled')) return

  // 截断或贴着渐变时先滚进可视区再选中；完全露出则立即选中。
  event.preventDefault()
  event.stopPropagation()
  activateToken += 1
  const token = activateToken
  focusChip(chip)

  const viewport = viewportRef.value
  if (!viewport) return
  const metrics = chipRevealMetrics(chip, viewport, CHIP_EDGE_FADE)
  if (isChipClear(metrics)) {
    selectChip(chip)
    return
  }

  void reveal(chip).then(() => {
    if (token !== activateToken) return
    selectChip(chip)
  })
}
</script>
