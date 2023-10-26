<template>
  <u-node-render :content="getChild()" ref="childRef" />
</template>

<script lang="ts" setup>
import type {
  CssTransitionProps,
  CssTransitionExposed
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

  dom?.classList.add(enterActive)

  requestAnimationFrame(() => {
    dom?.classList.add(enterTo)
  })
}

const transitionInactive = () => {
  const { enterActive, enterTo, leaveActive } = classes.value
  const dom = childRef.value?.$el
  dom?.classList.remove(enterActive)
  dom?.classList.add(leaveActive)
  requestAnimationFrame(() => {
    dom?.classList.remove(enterTo)
  })
}

watch(
  () => props.active,
  active => {
    active ? transitionActive() : transitionInactive()
  }
)

const transitionEndHandler = () => {
  const { active } = props
  const { leaveActive, enterActive } = classes.value
  const dom = childRef.value?.$el
  // 如果是激活状态，则移除enter-active类

  if (active) {
    dom?.classList.remove(enterActive)
  } else {
    dom?.classList.remove(leaveActive)
  }
}

watch(childRef, (child, oldChild) => {
  if (!child) {
    return oldChild?.$el.removeEventListener(
      'transitionend',
      transitionEndHandler
    )
  }

  child.$el.addEventListener('transitionend', transitionEndHandler)
})

onBeforeUnmount(() => {
  childRef.value?.$el.removeEventListener('transitionend', transitionEndHandler)
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
    active ? transitionActive() : transitionInactive()
  }
})
</script>
