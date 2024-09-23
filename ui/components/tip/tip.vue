<template>
  <!-- 触发 -->
  <UNodeRender
    v-bind="{ ...eventsHandlers, ...$attrs }"
    :content="getTriggerNode()"
    :class="cls.b"
    ref="triggerRef"
  />

  <!-- 弹出内容 -->
  <teleport to="body">
    <transition name="tip">
      <component
        v-if="visible || anyChildrenVisible"
        :is="contentTag"
        :class="contentClass"
        :style="[props.style, { zIndex: zIndex() }]"
        ref="contentRef"
        @mouseenter="eventsHandlers.onMouseenter"
        @mouseleave="eventsHandlers.onMouseleave"
        @click.stop
        v-click-outside="handleClickOutside"
      >
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
  inject,
  provide,
  shallowReactive,
  type ShallowRef,
  toRef
} from 'vue'
import { bem, extractNormalVNodes, zIndex } from '@ui/utils'
import { vClickOutside } from '@ui/directives'
import type { TipProps } from '@ui/types/components/tip'
import { useFallbackProps, usePop } from '@ui/compositions'
import { TipNestDIKey } from './di'
import { UNodeRender } from '../node-render'
import type { ComponentSize } from '@ui/types'

defineOptions({ name: 'Tip' })

const props = withDefaults(defineProps<TipProps>(), {
  content: '提示内容',
  trigger: 'hover',
  direction: 'top',
  alignment: 'center',
  contentTag: 'div'
})

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

const triggerRef = shallowRef<InstanceType<typeof UNodeRender>>()
const contentRef = shallowRef<HTMLElement>()
const arrowRef = shallowRef<HTMLElement>()

const visible = shallowRef(false)

function getTriggerNode() {
  const nodes = slots.default?.()
  if (!nodes?.length) return null

  const node = extractNormalVNodes(nodes)[0]
  return node
}

/**
 * 是否是嵌套tip，即在tip组件中嵌套其他的tip
 */
const childrenTips = shallowReactive(new Set<ShallowRef<boolean>>())

const anyChildrenVisible = computed(() => {
  return Array.from(childrenTips).some(tip => tip.value)
})

provide(TipNestDIKey, {
  addChild(visible) {
    childrenTips.add(visible)
  },
  removeChild(visible) {
    childrenTips.delete(visible)
  }
})

const { addChild, removeChild } = inject(TipNestDIKey, undefined) || {}
addChild?.(visible)

const eventsHandlers = computed(() => {
  const { trigger } = props

  const handlers: Record<string, Function> = {}

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
    triggerRef.value?.$el?.contains(e.target as Node)
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

usePop({
  triggerRef: toRef(() => triggerRef.value?.$el),
  contentRef,
  arrowRef,
  direction: toRef(() => props.direction),
  alignment: toRef(() => props.alignment),
  onTriggerPositionChange() {
    close()
  }
})

onBeforeUnmount(() => {
  clearTimeout(closeTimer)
  removeChild?.(visible)
})

defineExpose({ close })
</script>
