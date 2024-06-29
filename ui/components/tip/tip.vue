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
    <component
      v-if="visible"
      :is="contentTag"
      :class="contentClass"
      :style="tipStyle"
      ref="contentRef"
      @mouseenter="eventsHandlers.onMouseenter"
      @mouseleave="eventsHandlers.onMouseleave"
      @click.stop
      v-click-outside="handleClickOutside"
    >
      <slot name="content">{{ content }}</slot>
    </component>
  </teleport>
</template>

<script lang="ts" setup>
import {
  shallowRef,
  nextTick,
  computed,
  useSlots,
  onBeforeUnmount,
  watch,
  inject,
  provide,
  type CSSProperties,
  shallowReactive
} from 'vue'
import {
  bem,
  extractNormalVNodes,
  getScrollParents,
  observeTrigger,
  unobserveTrigger,
  zIndex
} from '@ui/utils'
import { vClickOutside } from '@ui/directives'
import type { TipProps, TipDirection } from '@ui/types/components/tip'
import { useFallbackProps, useTransition } from '@ui/compositions'
import { TipNestDIKey } from './di'
import { UNodeRender } from '../node-render'
import type { ComponentSize } from '@ui/types'
import { adjustContentWidth, calcTipPosition, getDirection } from './position'

defineOptions({ name: 'Tip' })

const props = withDefaults(defineProps<TipProps>(), {
  content: '提示内容',
  trigger: 'hover',
  direction: 'top',
  align: 'center',
  clickClose: false,
  contentTag: 'div',
  disabled: false
})

const cls = bem('tip')
const slots = useSlots()
const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const direction = shallowRef<TipDirection>(props.direction)

const transitionName = computed(() => {
  return `tip-${direction.value}`
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

const visible = shallowRef(false)

function getTriggerNode() {
  const nodes = slots.default?.()
  if (!nodes?.length) return null

  const node = extractNormalVNodes(nodes)[0]
  return node
}

const popStyle = shallowReactive<CSSProperties>({
  left: 0,
  top: 0,
  zIndex: zIndex()
})

const tipStyle = computed(() => {
  if (typeof props.style === 'string') {
    return [props.style, popStyle]
  }
  return {
    ...props.style,
    ...popStyle
  }
})

/**
 * 是否是嵌套tip，即在tip组件中嵌套其他的tip
 */
let hasChildren = shallowRef(false)
const setChildren = inject(TipNestDIKey, undefined)

if (setChildren) {
  setChildren()
  provide(TipNestDIKey, setChildren)
} else {
  provide(TipNestDIKey, () => {
    hasChildren.value = true
  })
}

const eventsHandlers = computed(() => {
  const { trigger, disabled } = props

  const handlers: Record<string, Function> = {}
  if (disabled) return handlers

  if (trigger === 'click') {
    handlers.onClick = open
  } else if (trigger === 'hover') {
    handlers.onMouseenter = open

    if (hasChildren.value) {
      handlers.onMouseleave = open
    } else {
      handlers.onMouseleave = close
    }
  }

  return handlers
})

const handleClickOutside = (e: MouseEvent) => {
  if (props.clickClose ?? hasChildren) return
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
const open = e => {
  console.log(e)
  closeTimer !== undefined && clearTimeout(closeTimer)
  visible.value = true
}
/** 关闭 */
const close = () => {
  if (props.trigger === 'hover') {
    closeTimer = setTimeout(() => {
      leave()
    }, 250)
  } else {
    leave()
  }
}

watch(visible, async v => {
  if (v) {
    await nextTick()
    window.addEventListener('resize', close)
    console.log(triggerRef.value)
    observeTrigger(triggerRef.value!.$el, updateTip)
    /** 添加滚动事件 */
    scrollParents = getScrollParents(triggerRef.value!.$el)
    addScrollEvent()
  } else {
    removeScrollEvent()
    window.removeEventListener('resize', close)
    unobserveTrigger(triggerRef.value!.$el)
  }
})

let scrollParents: HTMLElement[] = []

function addScrollEvent() {
  scrollParents.forEach(el => {
    el.addEventListener('scroll', close)
  })
}

function removeScrollEvent() {
  scrollParents.forEach(el => {
    el.removeEventListener('scroll', close)
  })

  scrollParents = []
}

function updateTip() {
  const triggerEl = triggerRef.value?.$el
  const contentEl = contentRef.value
  if (!triggerEl || !contentEl) return

  const triggerRect = triggerEl.getBoundingClientRect()

  // 调整内容宽度
  adjustContentWidth({
    triggerRect,
    contentEl,
    align: props.align,
    direction: direction.value
  })

  const { offsetHeight, offsetWidth } = contentEl

  const contentSize = {
    width: offsetWidth,
    height: offsetHeight
  }

  direction.value = getDirection({
    triggerRect,
    contentSize,
    direction: props.direction
  })

  enter()

  const styles = calcTipPosition({
    triggerRect,
    contentSize,
    direction: direction.value,
    align: props.align
  })

  popStyle.zIndex = zIndex()
  Object.assign(popStyle, styles)
}

onBeforeUnmount(() => {
  clearTimeout(closeTimer)
  window.removeEventListener('resize', close)
})

// 原生transition有一定的局限，
// 这边使用useTransition钩子来切换不同方向的过渡类
const { enter, leave } = useTransition('css', {
  name: transitionName,
  target: contentRef,
  afterLeave() {
    visible.value = false
  }
})

defineExpose({ close })
</script>
