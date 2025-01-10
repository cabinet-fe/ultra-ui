<template>
  <!-- 触发 -->
  <UNodeRender
    v-bind="eventsHandlers"
    :content="getTriggerNode()"
    ref="triggerRef"
  />

  <!-- 弹出内容 -->
  <teleport :to="`#${popperContainerId}`">
    <transition name="tip">
      <component
        v-if="nestVisible"
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
  inject,
  provide,
  shallowReactive,
  type ShallowRef,
  toRef,
  type VNode
} from 'vue'
import { bem, extractNormalVNodes, shallowComputed, zIndex } from '@ui/utils'
import { vClickOutside } from '@ui/directives'
import type { TipProps } from '@ui/types/components/tip'
import { useFallbackProps, usePop } from '@ui/compositions'
import { TipNestDIKey } from './di'
import { UNodeRender } from '../node-render'
import type { ComponentSize } from '@ui/types'

defineOptions({ name: 'Tip' })

const props = withDefaults(defineProps<TipProps>(), {
  content: '',
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

const contentStyle = computed(() => {
  return [props.style, { zIndex: zIndex() }]
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
 * 子级提示框
 */
const childrenTips = shallowReactive(new Set<ShallowRef<boolean>>())
/**
 * 是否有子级提示框正在显示中
 */
const anyChildrenVisible = computed(() => {
  return Array.from(childrenTips).some(tip => tip.value)
})

const nestVisible = computed(() => {
  return visible.value || anyChildrenVisible.value
})

provide(TipNestDIKey, {
  addChild(v) {
    childrenTips.add(v)
  },
  removeChild(v) {
    childrenTips.delete(v)
  }
})

const { addChild, removeChild } = inject(TipNestDIKey, undefined) || {}
addChild?.(nestVisible)

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

const triggerDom = shallowComputed(() => {
  if (triggerRef.value?.content) {
    return triggerRef.value.$el as HTMLElement
  }
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

/** 外部节点 */
const externalNode = shallowRef<any>()

function trigger(config: {
  triggerDom?: HTMLElement
  content?: string | VNode | (string | VNode)[]
}) {
  triggerDom.value = config.triggerDom
  externalNode.value = config.content
  open()
}

onBeforeUnmount(() => {
  clearTimeout(closeTimer)
  removeChild?.(visible)
})

defineExpose({
  close,
  trigger
})
</script>
