<template>
  <!-- dom解耦 -->
  <Teleport to="body">
    <div
      v-show="visible"
      :class="cls.e('overlay')"
      @click="close"
      :style="{
        zIndex: zIndex()
      }"
    >
      <transition name="dialog">
        <div
          v-if="visible || opened"
          v-show="visible"
          v-bind="$attrs"
          :class="cls.b"
          ref="dialogRef"
          :style="style"
          @click.stop
        >
          <section :class="cls.e('header')" ref="headerRef">
            <div :class="cls.e('title')">
              <slot name="header">
                {{ header || title }}
              </slot>
            </div>

            <div :class="cls.e('buttons')">
              <u-icon :class="cls.e('btn-minimize')"><Minus /></u-icon>
              <u-icon :class="cls.e('btn-maximize')" @click="toggleMaximize"
                ><Plus
              /></u-icon>
              <u-icon :class="cls.e('btn-close')"><CloseBold /></u-icon>
            </div>
          </section>

          <section :class="cls.e('body')">
            <slot />
          </section>
        </div>
      </transition>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { type VNode, shallowRef, shallowReactive, watch } from 'vue'
import type { DialogProps, DialogEmits } from '@ui/types/components/dialog'
import { bem, zIndex } from '@ui/utils'
import { useDrag, useModel } from '@ui/compositions'
import { UIcon } from '../icon'
import { CloseBold, Minus, Plus } from 'icon-ultra'

defineOptions({
  name: 'Dialog'
})

const props = defineProps<DialogProps>()
const emit = defineEmits<DialogEmits>()
const slots = defineSlots<{
  trigger?(): VNode[] | undefined
}>()
const cls = bem('dialog')

/** 弹框模板引用 */
const dialogRef = shallowRef<HTMLDivElement>()

/** 弹框头部模板引用 */
const headerRef = shallowRef<HTMLDivElement>()

const visible = useModel({
  props,
  propName: 'modelValue',
  emit
})

/** 是否弹出过 */
let opened = false

/** 样式 */
const style = shallowReactive({})

const show = () => {
  dialogRef.value?.classList.add(cls.m('visible'))
}
const hide = () => {
  dialogRef.value?.classList.remove(cls.m('visible'))
}

watch(visible, v => {
  // if (!v) return requestAnimationFrame(hide)

  if (!opened) {
    opened = true
  }
  // requestAnimationFrame(show)
})

/** 关闭 */
const close = () => {
  visible.value = false
}

let transformed = {
  x: 0,
  y: 0
}
useDrag({
  target: headerRef,

  onDrag(x, y) {

    const dom = dialogRef.value
    if (!dom) return
    dom.style.transform = `translate(${transformed.x + x}px,${
      transformed.y + y
    }px)`
  },

  onDragEnd(x, y) {
    transformed.x += x
    transformed.y += y
  }
})

/** 切换最大化 */
const toggleMaximize = () => {
  const dom = dialogRef.value
  if (!dom) return
  const targetCls = cls.m('maximum')
  if (dom.classList.contains(targetCls)) {
    requestAnimationFrame(() => {
      dom.classList.remove(targetCls)
    })
  } else {
    dom.style.height = dom.offsetHeight + 'px'
    requestAnimationFrame(() => {
      dom.classList.add(targetCls)
    })
  }
}

defineExpose({
  close
})
</script>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>
