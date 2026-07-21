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
        :style="[style, { zIndex: zIndex() }]"
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
  const fixed = [cls.e('content'), cls.m(size.value)]
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

const { update, popperContainerId } = usePop({
  triggerRef: triggerDom,
  contentRef,
  arrowRef,
  direction: toRef(() => props.direction),
  alignment: toRef(() => props.alignment),
  onTriggerPositionChange() {
    close()
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
