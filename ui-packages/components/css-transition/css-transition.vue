<template>
  <u-node-render :content="getChild()" ref="childRef" />
</template>

<script lang="ts" setup>
import type {
  CssTransitionProps,
  CssTransitionExposed,
  CssTransitionEmits
} from '@ui/types/components/css-transition'
import { isComment, isFragment, isTextNode } from '@ui/utils'
import {
  computed,
  shallowRef,
  useSlots,
  watch,
  onBeforeUnmount,
  type VNode
} from 'vue'
import type { Undef } from '@ui/types/helper'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'CssTransition',
  inheritAttrs: false
})

const props = defineProps<CssTransitionProps>()

const emit = defineEmits<CssTransitionEmits>()

let _active = props.active

const childRef = shallowRef<{
  $el: HTMLElement
}>()

const classes = computed(() => {
  const { name } = props
  return {
    enterTo: `${name}-enter-to`,
    enterActive: `${name}-enter-active`,
    leaveActive: `${name}-leave-active`
  }
})

const transitionActive = () => {
  const { enterActive, enterTo } = classes.value
  const dom = childRef.value?.$el
  // 标记进入动画激活状态
  dom?.classList.add(enterActive)
  // 在下一帧插入动画运动目标状态
  requestAnimationFrame(() => {
    dom?.classList.add(enterTo)
  })
}

const transitionInactive = () => {
  const { enterTo, leaveActive } = classes.value
  const dom = childRef.value?.$el

  // 标记动画进入离开状态
  dom?.classList.add(leaveActive)
  // 在下一帧移除动画运动目标状态恢复原点
  requestAnimationFrame(() => {
    dom?.classList.remove(enterTo)
  })
}

watch(
  () => props.active,
  active => {
    _active = active
    _active ? transitionActive() : transitionInactive()
  }
)

const transitionEndHandler = () => {
  const { leaveActive, enterActive } = classes.value
  const dom = childRef.value?.$el
  // 激活状态，移除enter-active类
  if (_active) {
    dom?.classList.remove(enterActive)
    emit('after-enter')
  } else {
    dom?.classList.remove(leaveActive)
    emit('after-leave')
  }
}

const transitionCancelHandler = () => {
  const { leaveActive, enterActive } = classes.value
  const dom = childRef.value?.$el
  // 激活状态，移除enter-active类
  if (_active) {
    dom?.classList.remove(enterActive)
    emit('enter-canceled')
  } else {
    dom?.classList.remove(leaveActive)
    emit('leave-canceled')
  }
}

/** 添加事件 */
const addEvent = (el?: HTMLElement) => {
  el?.addEventListener('transitioncancel', transitionCancelHandler)
  el?.addEventListener('transitionend', transitionEndHandler)
}

/** 移除事件 */
const removeEvent = (el?: HTMLElement) => {
  el?.removeEventListener('transitioncancel', transitionCancelHandler)
  el?.removeEventListener('transitionend', transitionEndHandler)
}

watch(childRef, (child, oldChild) => {
  child ? addEvent(child.$el) : removeEvent(oldChild?.$el)
})

onBeforeUnmount(() => {
  removeEvent(childRef.value?.$el)
})

const slots = useSlots()

const getChild = (): Undef<VNode> => {
  const nodes = slots.default?.() || []

  let i = -1
  while (++i < nodes.length) {
    const node = nodes[i]
    if (node === undefined) continue
    if (!isComment(node) && !isTextNode(node) && !isFragment(node)) {
      return node
    }
  }
}

defineExpose<CssTransitionExposed>({
  toggle(active: boolean | ((active: boolean) => boolean)): void {
    if (typeof active === 'function') {
      _active = active(_active)
      return this.toggle(_active)
    }
    _active = active
    console.log(_active)
    _active ? transitionActive() : transitionInactive()
  }
})
</script>
