<template>
  <UNodeRender :content="renderTriggerNode()" ref="trigger" />

  <Teleport :to="`#${popperContainerId}`">
    <component
      v-if="dropdownVisible"
      ref="contentRef"
      :is="contentTag"
      :class="dropdownContentClass"
      :style="[{ zIndex: zIndex() }, contentStyle]"
      @mouseenter="eventsHandlers.onMouseenter"
      @mouseleave="eventsHandlers.onMouseleave"
      @keydown="emit('keydown', $event)"
      v-click-outside="trigger === 'click' ? handleClickOutside : undefined"
    >
      <slot name="content" />
    </component>
  </Teleport>
</template>

<script lang="ts" setup>
import type { DropdownProps, DropdownExposed, DropdownEmits } from '@ultra-ui/pc/types'
import { bem, extractNormalVNodes, setStyles, zIndex } from '@ultra-ui/core'
import { shallowRef, computed, createVNode, cloneVNode, useTemplateRef, useAttrs } from 'vue'
import { vClickOutside } from '@ultra-ui/directives'
import { useModel, usePop, useTransition } from '@ultra-ui/core'
import { useNest } from '../tip/use-nest'
import { UNodeRender } from '../node-render'

defineOptions({ name: 'Dropdown', inheritAttrs: false })

const props = withDefaults(defineProps<DropdownProps>(), { trigger: 'hover', contentTag: 'div' })

const emit = defineEmits<DropdownEmits>()

const slots = defineSlots<{
  /** 内容 */
  content?: () => any
  /** 触发器 */
  trigger?: () => any
}>()

const cls = bem('dropdown')

const dropdownContentClass = computed(() => {
  let fixed = [cls.e('content')]
  const className = props.contentClass
  if (!className) return fixed
  if (!Array.isArray(className)) {
    return [...fixed, className]
  }
  return [...fixed, ...className]
})

const triggerRef = useTemplateRef('trigger')
const customTriggerRef = shallowRef<HTMLElement>()
const contentRef = shallowRef<HTMLElement>()

const triggerDom = computed(() => {
  return customTriggerRef.value || triggerRef.value?.$el
})

/**显示隐藏 */
const visible = useModel({ defaultValue: false, propName: 'visible', props, emit })

const dropdownVisible = useNest(visible)

let closeTimer: number | undefined

const attrs = useAttrs()
function renderTriggerNode() {
  const slotsNode = slots.trigger?.()
  if (!slotsNode) return null
  const nodes = extractNormalVNodes(slotsNode)
  const props = { class: cls.b, ...attrs, ...eventsHandlers.value }
  if (nodes.length === 1) return cloneVNode(nodes[0]!, props)

  return createVNode('div', props, nodes)
}

function stopClose() {
  closeTimer !== undefined && clearTimeout(closeTimer)
}

/** 打开下拉框 */
function open(config?: { trigger?: HTMLElement }) {
  stopClose()
  const { trigger } = config || {}
  if (trigger && trigger instanceof HTMLElement) {
    customTriggerRef.value = trigger
  }

  visible.value = true
}

function close() {
  if (props.trigger === 'hover') {
    // 给200毫秒重新浮动的缓冲时间
    closeTimer = setTimeout(() => {
      transition.leave()
    }, 200)
  } else {
    transition.leave()
  }
}

/** 点击外部 */
function handleClickOutside(e: MouseEvent) {
  const { trigger } = props
  // 当下拉框为点击时触发时，点击触发元素时不关闭
  // 其他任何时候点击外部都关闭下拉器
  if (trigger === 'click' && triggerDom.value.contains(e.target as Node)) {
    return
  }
  close()
}

const transitionName = shallowRef('slide-down')

const { update, popperContainerId } = usePop({
  triggerRef: triggerDom,
  contentRef,
  direction: 'bottom',
  alignment: 'start',
  onPop(position) {
    transitionName.value = position.placement.includes('top') ? 'slide-up' : 'slide-down'

    transition.enter()
  },

  onTriggerPositionChange() {
    close()
  },

  onBeforeUpdate(triggerEl, contentEl) {
    setStyles(contentEl, {
      width: props.width ?? `${triggerEl.offsetWidth}px`,
      minWidth: props.minWidth
    })
  }
})

const transition = useTransition('css', {
  name: transitionName,
  target: contentRef,
  afterLeave() {
    visible.value = false
  },

  leaveCanceled() {
    visible.value = false
  }
})

function triggerClick() {
  if (visible.value) {
    close()
  } else {
    open()
  }
}

const eventsHandlers = computed(() => {
  const { trigger, disabled } = props

  const handlers: Record<string, Function> = {}
  if (disabled || trigger === 'custom') return handlers

  if (trigger === 'click') {
    handlers.onClick = triggerClick
  } else if (trigger === 'hover') {
    handlers.onMouseenter = open
    handlers.onMouseleave = close
  }

  return handlers
})

defineExpose<DropdownExposed>({
  open,
  close,
  /**暴露出更新dropdown内容位置方法 适用与级联选择器组件 */
  updateDropdown: update
})
</script>
