<template>
  <!-- 触发 -->
  <UNodeRender
    v-bind="eventsHandlers"
    :content="renderDefaultSlotTrigger()"
    ref="triggerRef"
  />

  <!-- 弹出内容 -->
  <teleport :to="`#${popperContainerId}`">
    <transition name="tip">
      <component
        v-if="tipVisible"
        :is="contentTag"
        :class="contentClass"
        :style="contentStyle"
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
import {
  shallowRef,
  computed,
  useSlots,
  onBeforeUnmount,
  toRef,
  watch,
  nextTick
} from 'vue'
import { bem, extractNormalVNodes, zIndex } from '@ui/utils'
import { vClickOutside } from '@ui/directives'
import type { TipProps, ComponentSize, TipEmits } from '@ui/types'
import { useFallbackProps, useModel, usePop } from '@ui/compositions'
import { UNodeRender } from '../node-render'
import { useNest } from './use-nest'

defineOptions({ name: 'Tip' })

const props = withDefaults(defineProps<TipProps>(), {
  content: '',
  trigger: 'hover',
  direction: 'top',
  alignment: 'center',
  contentTag: 'div'
})

const emit = defineEmits<TipEmits>()

const cls = bem('tip')
const slots = useSlots()
const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const contentClass = computed(() => {
  const fixed = [cls.e('content'), cls.m(size.value)]
  const className = props.class
  if (!Array.isArray(className)) {
    return [...fixed, className]
  }
  return [...fixed, ...className]
})

const contentStyle = computed(() => {
  return [props.style, { zIndex: zIndex() }]
})

const triggerRef = shallowRef<InstanceType<typeof UNodeRender>>()
const contentRef = shallowRef<HTMLElement>()
const arrowRef = shallowRef<HTMLElement>()

const visible = useModel({
  defaultValue: false,
  propName: 'visible',
  props,
  emit
})

const tipVisible = useNest(visible)

function renderDefaultSlotTrigger() {
  const nodes = slots.default?.()
  if (!nodes?.length) return null
  const node = extractNormalVNodes(nodes)[0]
  return node
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

  if (
    props.trigger === 'click' &&
    triggerDom.value.contains(e.target as Node)
  ) {
    return
  }
  close()
}

let closeTimer: number | undefined = undefined

/** 弹出 */
const open = () => {
  closeTimer !== undefined && clearTimeout(closeTimer)
  visible.value = true
}
/** 关闭 */
const close = () => {
  if (props.trigger === 'hover') {
    closeTimer = setTimeout(() => {
      visible.value = false
    }, 250)
  } else {
    visible.value = false
  }
}

const triggerDom = computed(() => {
  return props.triggerDom || triggerRef.value?.$el
})

const { popperContainerId } = usePop({
  triggerRef: triggerDom,
  contentRef,
  arrowRef,
  direction: toRef(() => props.direction),
  alignment: toRef(() => props.alignment),
  onTriggerPositionChange() {
    close()
  }
})

watch(triggerDom, () => {
  if (visible.value) {
    close()
    nextTick(() => open())
  }
})

/** 外部节点 */
const externalNode = shallowRef<any>()

onBeforeUnmount(() => {
  clearTimeout(closeTimer)
})
</script>
