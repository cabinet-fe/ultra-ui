<template>
  <Teleport to="body">
    <transition name="dialog-overlay">
      <!--  -->
      <div
        v-if="visible || opened"
        v-show="visible"
        :class="cls.e('overlay')"
        :style="{
          zIndex: zIndex()
        }"
        @click="close"
      >
        <u-css-transition name="dialog" ref="transitionRef">
          <div v-bind="$attrs" :class="cls.b" ref="dialogRef" @click.stop>
            <section :class="cls.e('header')" ref="headerRef">
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
                <u-icon :class="cls.e('btn-close')" @click="close"
                  ><CloseBold
                /></u-icon>
              </div>
            </section>

            <u-scroll tag="section" :class="cls.e('body')" ref="bodyRef">
              <slot />
            </u-scroll>
          </div>
        </u-css-transition>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { type VNode, shallowRef, watch, shallowReactive } from 'vue'
import type { DialogProps, DialogEmits } from '@ui/types/components/dialog'
import { bem, zIndex } from '@ui/utils'
import { useDrag, useModel, useResizeObserver } from '@ui/compositions'
import { UIcon } from '../icon'
import { UScroll, type ScrollExposed } from '../scroll'
import { UCssTransition, type CssTransitionExposed } from '../css-transition'
import { CloseBold, Minus, Maximum } from 'icon-ultra'
import { debounce } from 'cat-kit'
import { useMaximum } from './use-maximum'

// 打开visible
// overlay首先从透明到不透明的动画过渡
// 当overlay的动画进行到1帧时dialog动画触发
// dialog动画触发后移除动画的transition类

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

/** 过渡组件模板引用 */
const transitionRef = shallowRef<CssTransitionExposed>()

const visible = useModel({ props, emit })

const style = shallowReactive({
  zIndex: zIndex()
})

/** 是否弹出过 */
let opened = false

const whenVisibleToTrue = () => {
  if (!opened) opened = true

  style.zIndex = zIndex()

  requestAnimationFrame(() => {
    transitionRef.value?.toggle(true)
  })
}

const whenVisibleToFalse = () => {
  transitionRef.value?.toggle(false)
}
watch(visible, v => {
  v ? whenVisibleToTrue() : whenVisibleToFalse()
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
  dom.style.transform = `translate(${x}px,${y}px)`
}

// 运用拖拽
useDrag({
  target: headerRef,

  onDrag(x, y) {
    if (maximized.value) return
    updateDialogTransform(translated.x + x, translated.y + y)
  },

  onDragEnd(x, y) {
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

defineExpose({
  close
})
</script>

<script lang="ts">
export default {
  inheritAttrs: false
}
</script>
