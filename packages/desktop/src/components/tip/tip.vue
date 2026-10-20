<template>
  <!-- 触发 -->
  <UNodeRender v-bind="eventsHandlers" :content="renderDefaultSlotTrigger()" ref="triggerRef" />

  <!-- 弹出内容 -->
  <teleport :to="`#${popperContainerId}`">
    <transition name="tip">
      <component
        v-if="tipVisible"
        :is="contentTag"
        :class="contentClass"
        :style="[contentStyle, { zIndex: zIndex() }]"
        ref="contentRef"
        @mouseenter="eventsHandlers.onMouseenter"
        @mouseleave="eventsHandlers.onMouseleave"
        @click.stop
        v-click-outside="handleClickOutside"
      >
        <UNodeRender v-if="externalNode" :content="externalNode" />

        <slot name="content">{{ content }}</slot>

        <div :class="cls.e('arrow')" v-if="!hideArrow" ref="arrowRef"></div>
      </component>
    </transition>
  </teleport>
</template>

<script lang="ts" setup>
import { useFallbackProps, usePop } from '@veltra/compositions'
import { vClickOutside } from '@veltra/directives'
import { bem, extractNormalVNodes, zIndex } from '@veltra/utils'
import { shallowRef, computed, useSlots, onBeforeUnmount, toRef, watch, nextTick } from 'vue'

import type { TipProps, ComponentSize, TipEmits } from '../../types'
import { UNodeRender } from '../node-render'
import { useNest } from './use-nest'

defineOptions({ name: 'UTip' })

const props = withDefaults(defineProps<TipProps>(), {
  content: '',
  trigger: 'hover',
  direction: 'top',
  alignment: 'center',
  contentTag: 'div',
  visible: undefined,
  showDelay: 0
})

const emit = defineEmits<TipEmits>()

const cls = bem('tip')
const slots = useSlots()
const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const contentClass = computed(() => {
  const fixed = [cls.e('content'), cls.m(size.value), props.type && cls.m('color-' + props.type)]
  const className = props.class
  if (!Array.isArray(className)) {
    return [...fixed, className]
  }
  return [...fixed, ...className]
})

const triggerRef = shallowRef<InstanceType<typeof UNodeRender>>()
const contentRef = shallowRef<HTMLElement>()
const arrowRef = shallowRef<HTMLElement>()

const _visible = shallowRef(false)

const visible = computed(() => {
  return props.visible !== undefined ? props.visible : _visible.value
})

function updateVisible(v: boolean) {
  if (props.visible === undefined) {
    _visible.value = v
  } else {
    emit('update:visible', v)
  }
}

const tipVisible = useNest(visible)

function renderDefaultSlotTrigger() {
  const nodes = slots.default?.()
  if (!nodes?.length) return null
  return extractNormalVNodes(nodes)[0]
}

const eventsHandlers = computed(() => {
  const { trigger, disabled } = props

  const handlers: Record<string, Function> = {}

  if (disabled) return handlers

  if (trigger === 'click') {
    handlers.onClick = open
  } else if (trigger === 'hover') {
    handlers.onMouseenter = open
    handlers.onMouseleave = close
  }

  return handlers
})

const handleClickOutside = (e: MouseEvent) => {
  if (props.trigger === 'hover') return

  // 点击的元素在触发元素中则啥也
  if (props.trigger === 'click' && triggerDom.value.contains(e.target as Node)) {
    return
  }
  close()
}

let openTimer: ReturnType<typeof setTimeout> | undefined
let closeTimer: ReturnType<typeof setTimeout> | undefined

function clearOpenTimer() {
  if (openTimer !== undefined) {
    clearTimeout(openTimer)
    openTimer = undefined
  }
}

function clearCloseTimer() {
  if (closeTimer !== undefined) {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }
}

/** 弹出 */
const open = (e?: PointerEvent) => {
  e?.stopPropagation()
  clearCloseTimer()

  const delay = props.trigger === 'hover' ? props.showDelay : 0
  if (delay <= 0) {
    clearOpenTimer()
    updateVisible(true)
    return
  }

  clearOpenTimer()
  openTimer = setTimeout(() => {
    openTimer = undefined
    updateVisible(true)
  }, delay)
}
/** 关闭 */
const close = () => {
  clearOpenTimer()

  if (props.trigger === 'hover') {
    closeTimer = setTimeout(() => {
      closeTimer = undefined
      updateVisible(false)
    }, 250)
  } else {
    updateVisible(false)
  }
}

const triggerDom = computed(() => {
  return props.triggerDom || triggerRef.value?.$el
})

type TipSide = 'top' | 'bottom' | 'left' | 'right'

const placementSide = shallowRef<TipSide>(props.direction)

function originFor(side: TipSide): string {
  if (side === 'top') return 'center bottom'
  if (side === 'bottom') return 'center top'
  if (side === 'left') return 'right center'
  return 'left center'
}

const contentStyle = computed(() => {
  const origin = { transformOrigin: originFor(placementSide.value) }
  const base = props.style
  if (base == null || base === '') return origin
  if (typeof base === 'string') return [base, origin]
  return [base, origin]
})

watch(
  () => props.direction,
  (side) => {
    placementSide.value = side
  }
)

const { update, popperContainerId } = usePop({
  triggerRef: triggerDom,
  contentRef,
  arrowRef,
  direction: toRef(() => props.direction),
  alignment: toRef(() => props.alignment),
  onTriggerPositionChange() {
    close()
  },
  onPop(position) {
    const side = position.placement.split('-')[0] as TipSide
    if (side === 'top' || side === 'bottom' || side === 'left' || side === 'right') {
      placementSide.value = side
    }
  }
})

watch(triggerDom, (dom) => {
  // TODO: 看起来不是很优雅
  if (dom?.nodeType === Node.ELEMENT_NODE && visible.value) {
    nextTick(() => {
      void update()
    })
  }
})

/** 外部节点 */
const externalNode = shallowRef<any>()

onBeforeUnmount(() => {
  clearOpenTimer()
  clearCloseTimer()
})
</script>
