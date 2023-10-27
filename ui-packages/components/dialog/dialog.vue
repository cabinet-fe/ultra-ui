<template>
  <!-- dom解耦 -->
  <Teleport to="body">
    <transition name="dialog-overlay">
      <div
        v-if="visible || opened"
        v-show="visible"
        :class="cls.e('overlay')"
        @click="close"
        :style="{
          zIndex: zIndex()
        }"
      >
        <u-css-transition name="dialog" ref="transitionRef">
          <div
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
                <u-icon
                  :class="cls.e('btn-minimize')"
                  @click="toggleMinimize(true)"
                  ><Minus
                /></u-icon>
                <u-icon :class="cls.e('btn-maximize')" @click="toggleMaximize">
                  <Plus />
                </u-icon>
                <u-icon :class="cls.e('btn-close')"><CloseBold /></u-icon>
              </div>
            </section>

            <u-scroll
              tag="section"
              :class="cls.e('body')"
              :style="{
                height: bodyHeight + 'px'
              }"
            >
              <slot />
            </u-scroll>
          </div>
        </u-css-transition>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { type VNode, shallowRef, shallowReactive, watch } from 'vue'
import type { DialogProps, DialogEmits } from '@ui/types/components/dialog'
import { bem, zIndex } from '@ui/utils'
import { useDrag, useModel, useResizeObserver } from '@ui/compositions'
import { UIcon } from '../icon'
import { UScroll } from '../scroll'
import { UCssTransition, type CssTransitionExposed } from '../css-transition'
import { CloseBold, Minus, Plus } from 'icon-ultra'
import { debounce } from 'cat-kit'

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

/** 过渡组件模板引用 */
const transitionRef = shallowRef<CssTransitionExposed>()

const visible = useModel({
  props,
  propName: 'modelValue',
  emit
})

/** 是否弹出过 */
let opened = false

/** 样式 */
const style = shallowReactive({})

watch(visible, v => {
  if (!opened) {
    opened = true
  }

  v
    ? requestAnimationFrame(() => {
        transitionRef.value?.toggle(true)
      })
    : transitionRef.value?.toggle(false)
})

/** 关闭 */
const close = () => {
  visible.value = false
}

let transformed = {
  x: 0,
  y: 0
}

/** 更新弹框位置 */
const updateDialogTransform = (x: number, y: number) => {
  const dom = dialogRef.value
  if (!dom) return
  dom.style.transform = `translate(${x}px,${y}px)`
}

useDrag({
  target: headerRef,

  onDrag(x, y) {
    updateDialogTransform(transformed.x + x, transformed.y + y)
  },

  onDragEnd(x, y) {
    transformed.x += x
    transformed.y += y
  }
})

const bodyHeight = shallowRef(0)
// 因为弹框的最大高度为500px
useResizeObserver({
  target: dialogRef,
  onResize: debounce(([entry]) => {
    if (!entry) return
    const target = entry.target as HTMLDivElement
    bodyHeight.value = target.offsetHeight - 49
  }, 20)
})

/** 切换最大化 */
const toggleMaximize = (): void => {
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

const toggleMinimize = (minimum: boolean): void => {
  const dom = dialogRef.value
  if (!dom) return
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
