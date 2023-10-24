<template>
  <!-- dom解耦 -->
  <Teleport to="body">
    <transition name="dialog-fade"> </transition>
    <div
      v-if="visible"
      :class="cls.e('overlay')"
      @click="close"
      :style="{
        zIndex: zIndex()
      }"
    >
      <div v-bind="$attrs" :class="cls.b" :style="style" @click.stop>
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
import type { DialogProps, DialogEmits } from '@ui/types/components/dialog'
import { bem, withUnit, zIndex } from '@ui/utils'

defineOptions({
  name: 'Dialog'
})

defineProps<DialogProps>()
const emit = defineEmits<DialogEmits>()
const slots = defineSlots<{
  trigger?(): VNode[] | undefined
}>()
const cls = bem('popup')

const visible = shallowRef(false)

/** 样式 */
const style = shallowReactive({
  left: undefined as string | undefined,
  top: undefined as string | undefined,
  transform: undefined as string | undefined
})

/** 显示弹框 */
const show = () => {
  style.transform = getTargetTransformValue()
}

/** 隐藏弹框 */
const hide = () => {
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
  const { left, top } = style
  const { innerWidth, innerHeight } = window
  const { offsetHeight, offsetWidth } = popDom

  const targetX =
    innerWidth / 2 - offsetWidth / 2 - parseInt(left ?? '0') + 'px'
  const targetY =
    innerHeight / 2 - offsetHeight / 2 - parseInt(top ?? '0') + 'px'

  return `scale3d(1, 1, 1) translate(${targetX}, ${targetY}) `
}

/**
 * 弹出
 * @param config 弹框配置
 */
const popup = config => {
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
  popup,

  close
})
</script>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>
