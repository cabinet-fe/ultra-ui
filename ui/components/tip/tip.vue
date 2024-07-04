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
        :style="tipStyle"
        ref="contentRef"
        @mouseenter="eventsHandlers.onMouseenter"
        @mouseleave="eventsHandlers.onMouseleave"
        @click.stop
        v-click-outside="handleClickOutside"
      >
        <slot name="content">{{ content }}</slot>
      </component>
    </transition>
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
  shallowReactive,
  type ShallowRef
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
import { useFallbackProps } from '@ui/compositions'
import { TipNestDIKey } from './di'
import { UNodeRender } from '../node-render'
import type { ComponentSize } from '@ui/types'
import { adjustContentSize, amendDirection, calcTipPosition } from './position'

defineOptions({ name: 'Tip' })

const props = withDefaults(defineProps<TipProps>(), {
  content: '提示内容',
  trigger: 'hover',
  direction: 'top',
  alignment: 'center',
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
  if (props.clickClose) return
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

watch(visible, async v => {
  if (v) {
    await nextTick()
    window.addEventListener('resize', close)

    observeTrigger(triggerRef.value!.$el, updateTipStyle)
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

/**
 * 更新提示框的样式
 */
function updateTipStyle() {
  const triggerEl = triggerRef.value?.$el
  const contentEl = contentRef.value
  if (!triggerEl || !contentEl) return

  const triggerRect = triggerEl.getBoundingClientRect()

  const { offsetHeight, offsetWidth } = contentEl

  let contentSize = {
    width: offsetWidth,
    height: offsetHeight
  }

  // 修正方向
  direction.value = amendDirection({
    triggerRect,
    contentSize,
    direction: props.direction
  })

  // 调整内容尺寸, 防止内容溢出
  contentSize = adjustContentSize({
    triggerRect,
    contentEl,
    contentSize,
    direction: direction.value,
    alignment: props.alignment
  })

  const styles = calcTipPosition({
    triggerRect,
    contentSize,
    direction: direction.value,
    alignment: props.alignment
  })
  popStyle.zIndex = zIndex()
  Object.assign(popStyle, styles)
}

onBeforeUnmount(() => {
  clearTimeout(closeTimer)
  window.removeEventListener('resize', close)
  removeChild?.(visible)
})

defineExpose({ close })
</script>
