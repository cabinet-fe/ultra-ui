<template>
  <div :class="cls.b">
    <!-- <slot name="trigger" /> -->
    <UNodeRender
      :content="renderTrigger()"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    />

    <transition :name="cls.b">
      <div v-if="visible" :style="contentStyle" :class="cls.e('content')">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import {
  onBeforeUnmount,
  Text,
  type VNode,
  shallowRef,
  shallowReactive,
  watch,
  useSlots
} from 'vue'
import type { PopupProps, PopupEmits } from '@ui/types/components/popup'
import { bem, withUnit, zIndex } from '@ui/utils'
import { UNodeRender } from '../node-render'
import { useModel } from '@ui/compositions'

defineOptions({
  name: 'Popup'
})
const props = withDefaults(defineProps<PopupProps>(), {
  arrow: true
})
const emit = defineEmits<PopupEmits>()
const slots = useSlots()

const cls = bem('popup')

const visible = useModel({ props, propName: 'visible', emit, local: true })

const renderTrigger = () => {
  const trigger = slots.trigger?.()

  return trigger?.filter(node => node.type !== Text)?.[0]
}

const contentStyle = shallowReactive({
  zIndex: 0
})

// 鼠标移入移出动画
const handleMouseEnter = () => {
  visible.value = true
  contentStyle.zIndex = zIndex()
}

const handleMouseLeave = () => {
  setTimeout(() => {
    visible.value = false
  }, 150)
}
</script>
