<template>
  <!-- 渲染触发器 -->
  <UNodeRender :content="renderTrigger()" @click="pop" />

  <!-- dom解耦 -->
  <Teleport to="body">
    <div
      v-if="visible"
      :class="cls.e('overlay')"
      @click="close"
      :style="{
        zIndex: zIndex()
      }"
    >
      <div ref="popRef" v-bind="$attrs" :class="cls.b" :style="style">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import {
  onBeforeUnmount,
  Text,
  type VNode,
  shallowRef,
  shallowReactive,
  watch
} from 'vue'
import type {
  PopupProps,
  PopConfig,
  PopupEmits
} from '@ui/types/components/popup'
import { bem, withUnit, zIndex } from '@ui/utils'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'Popup'
})

defineProps<PopupProps>()
const emit = defineEmits<PopupEmits>()
const slots = defineSlots<{
  trigger?(): VNode[] | undefined
}>()
const cls = bem('popup')

const visible = shallowRef(false)

/** 弹出框dom引用 */
const popRef = shallowRef<HTMLElement>()

/** 样式 */
const style = shallowReactive({
  left: undefined as string | undefined,
  top: undefined as string | undefined,
  transform: undefined as string | undefined
})

/** 显示弹框 */
const show = () => {
  popRef.value?.classList.add(cls.m('visible'))
  style.transform = getTargetTransformValue()
}

/** 隐藏弹框 */
const hide = () => {
  popRef.value?.classList.remove(cls.m('visible'))
  style.transform = undefined
}

watch(visible, v => {
  if (v) {
    // 在下个帧触发动画
    requestAnimationFrame(show)
    // 添加resize事件以便在窗口尺寸变更时弹框可以处于中间
    window.addEventListener('resize', resizeEventHandler)
  } else {
    // 在下个帧触发动画
    requestAnimationFrame(hide)
    // 移除resize事件
    window.removeEventListener('resize', resizeEventHandler)
  }
})

/** pop弹框的目标变形值 */
const getTargetTransformValue = () => {
  const popDom = popRef.value
  if (!popDom) return

  const { left, top } = style
  const { innerWidth, innerHeight } = window
  const { offsetHeight, offsetWidth } = popDom

  const targetX =
    innerWidth / 2 - offsetWidth / 2 - parseInt(left ?? '0') + 'px'
  const targetY =
    innerHeight / 2 - offsetHeight / 2 - parseInt(top ?? '0') + 'px'

  return `scale3d(1, 1, 1) translate(${targetX}, ${targetY}) `
}

/** 渲染触发器 */
const renderTrigger = () => {
  const nodes = slots.trigger?.()
  return nodes?.filter(node => node.type !== Text)?.[0]
}

/**
 * 弹出
 * @param config 弹框配置
 */
const pop = (config: PopConfig) => {
  visible.value = true

  const { x, y, trigger } = config

  // 使用传入的值来指定弹框的位置
  if (x !== undefined || y !== undefined) {
    style.left = withUnit(x, 'px')
    style.top = withUnit(y, 'px')
  }
  // 指定触发的dom元素，将位置定位到该元素附近然后再进行动画过渡
  else if (trigger) {
    style.left = withUnit(trigger.offsetLeft, 'px')
    style.top = withUnit(trigger.offsetTop, 'px')
  }
}

/** 关闭 */
const close = () => {
  visible.value = false
}

const resizeEventHandler = () => {
  style.transform = getTargetTransformValue()
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeEventHandler)
})

defineExpose({
  pop,

  close
})
</script>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>
