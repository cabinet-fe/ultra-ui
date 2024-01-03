<template>
  <Teleport to="body">
    <transition name="dialog-overlay">
      <div
        v-if="visible || opened"
        v-show="visible"
        :class="cls.e('overlay')"
        :style="{
          zIndex: zIndex()
        }"
        @click="close"
      >
        <div v-bind="$attrs" :class="cls.b" ref="dialogRef" @click.stop>
          <section
            :class="cls.e('header')"
            ref="headerRef"
            @transitionend.stop
            @transitioncancel.stop
          >
            <div :class="cls.e('title')">
              <slot name="header">
                {{ header || title }}
              </slot>
            </div>

            <div :class="cls.e('buttons')">
              <u-icon
                :class="cls.e('btn-minimize')"
                @click="toggleMinimize(true)"
              >
                <Minus />
              </u-icon>
              <u-icon :class="cls.e('btn-maximize')" @click="toggleMaximize">
                <Maximum />
              </u-icon>
              <u-icon :class="cls.e('btn-close')" @click="close">
                <CloseBold />
              </u-icon>
            </div>
          </section>

          <u-scroll
            tag="section"
            :class="cls.e('body')"
            ref="bodyRef"
            @transitionend.stop
            @transitioncancel.stop
          >
            <slot />
          </u-scroll>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { type VNode, shallowRef, watch, shallowReactive } from 'vue'
import type { DialogProps, DialogEmits } from '@ui/types/components/dialog'
import { bem, zIndex } from '@ui/utils'
import {
  useDrag,
  useModel,
  useResizeObserver,
  useTransition
} from '@ui/compositions'
import { UIcon } from '../icon'
import { UScroll, type ScrollExposed } from '../scroll'
import { CloseBold, Minus, Maximum } from 'icon-ultra'
import { debounce } from 'cat-kit'
import { useMaximum } from './use-maximum'

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

/** 弹框头部模板引用 */
const bodyRef = shallowRef<ScrollExposed>()

const visible = useModel({ props, emit })

const style = shallowReactive({
  zIndex: zIndex()
})

/** 是否弹出过 */
let opened = false

watch(visible, v => {
  if (!v) {
    return dialogTransition.toggle(false)
  }
  if (!opened) opened = true

  style.zIndex = zIndex()
  translated.x = 0
  translated.y = 0
  // 先等overlay层动画开始再开始dialog过渡,否则过渡效果不会产生
  requestAnimationFrame(() => {
    dialogTransition.toggle(true)
  })
})

/** dialog位移的位置 */
const translated = {
  x: 0,
  y: 0
}

/** 更新弹框位置 */
const updateDialogTransform = (x: number, y: number) => {
  const dom = dialogRef.value
  if (!dom) return
  dom.style.transform = `scale3d(1, 1, 1) translate(${x}px,${y}px)`
}

// 运用拖拽
useDrag({
  target: headerRef,

  onDrag(x, y) {
    if (maximized.value) return
    updateDialogTransform(translated.x + x, translated.y + y)
  },

  onDragEnd(x, y) {
    if (maximized.value) return
    translated.x += x
    translated.y += y
  }
})

// 因为弹框的最大高度为500px
useResizeObserver({
  target: dialogRef,
  onResize: debounce(([entry]) => {
    if (!entry || !bodyRef.value?.containerRef) return
    const target = entry.target as HTMLDivElement
    bodyRef.value.containerRef.style.height = `${target.offsetHeight - 49}px`
  }, 20)
})

const { toggleMaximize, maximized } = useMaximum({
  dialogRef,
  cls
})

const toggleMinimize = (minimum: boolean): void => {
  const dom = dialogRef.value
  if (!dom) return
}

/** 关闭 */
const close = () => {
  visible.value = false
}

const dialogTransition = useTransition('style', {
  target: dialogRef,
  enterToStyle: {
    transform: 'scale3d(1, 1, 1) translate(0, 0) '
  },
  transitionInStyle: {
    transition: 'transform 0.25s cubic-bezier(0.76, 0, 0.44, 1.35)'
  },
  transitionOutStyle: {
    transition: 'transform 0.25s cubic-bezier(0.76, 0, 0.44, 1.35)'
  }
})

defineExpose({
  close
})
</script>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>
