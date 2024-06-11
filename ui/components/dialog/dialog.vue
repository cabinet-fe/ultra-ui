<template>
  <Teleport to="body">
    <transition name="fade" @after-leave="emit('closed')">
      <div
        v-if="visible || opened"
        v-show="visible"
        :class="[cls.e('overlay'), bem.is('modal', modal)]"
        :style="style"
        @mousedown="modal && close()"
      >
        <div v-bind="$attrs" :class="className" ref="dialogRef" @click.stop>
          <section
            :class="headerCls"
            ref="headerRef"
            @transitionend.stop
            @transitioncancel.stop
          >
            <div :class="cls.e('title')" @mousedown.stop>
              <slot name="header">
                {{ header || title }}
              </slot>
            </div>

            <div :class="cls.e('buttons')" @mousedown.stop>
              <u-icon
                v-if="maximized"
                :class="cls.e('btn-recover')"
                @click="toggleMaximize(false)"
                title="还原"
              >
                <Recover />
              </u-icon>
              <u-icon
                v-else
                :class="cls.e('btn-maximize')"
                @click="toggleMaximize(true)"
                title="最大化"
              >
                <Maximum />
              </u-icon>
              <u-icon :class="cls.e('btn-close')" @click="close" title="关闭">
                <Close />
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

          <section ref="footerRef" :class="footerCls" v-if="$slots.footer">
            <slot name="footer" />
          </section>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import {
  type VNode,
  shallowRef,
  watch,
  shallowReactive,
  nextTick,
  computed
} from 'vue'
import type { DialogProps, DialogEmits } from '@ui/types/components/dialog'
import { bem, nextFrame, setStyles, zIndex } from '@ui/utils'
import { useDrag, useFallbackProps, useTransition } from '@ui/compositions'
import { UIcon } from '../icon'
import { UScroll, type ScrollExposed } from '../scroll'
import { Close, Maximum, Recover } from 'icon-ultra'
import { useMaximum } from './use-maximum'
import type { ComponentSize } from '@ui/types/component-common'

defineOptions({
  name: 'Dialog',
  inheritAttrs: false
})

const props = withDefaults(defineProps<DialogProps>(), {
  modal: true
})
const emit = defineEmits<DialogEmits>()
const slots = defineSlots<{
  footer?(): VNode[] | undefined
}>()

const cls = bem('dialog')
const blurCls = bem.is('background-blur')
const headerCls = [cls.e('header'), blurCls]
const footerCls = [cls.e('footer'), blurCls]

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

/** 弹框模板引用 */
const dialogRef = shallowRef<HTMLDivElement>()

/** 弹框头部模板引用 */
const headerRef = shallowRef<HTMLDivElement>()

/** 弹框body模板引用 */
const bodyRef = shallowRef<ScrollExposed>()

/** 弹框footer模板引用 */
const footerRef = shallowRef<HTMLDivElement>()

const visible = defineModel<boolean>()

const style = shallowReactive({
  zIndex: zIndex()
})

const dialogTransition = useTransition('style', {
  target: dialogRef,

  enterTo: {
    transform: 'scale3d(1, 1, 1) translate(0, 0)'
  },

  enterActive: {
    transition: 'transform .25s cubic-bezier(0.76, 0, 0.44, 1.35)'
  },
  leaveActive: {
    transition: 'transform .25s cubic-bezier(0.76, 0, 0.44, 1.35)'
  }
})

/** 是否弹出过 */
let opened = false

watch(visible, v => {
  if (!v) {
    dialogTransition.leave()
    nextFrame(() => {
      dialogRef.value &&
        setStyles(dialogRef.value, {
          transform: 'scale3d(0.5, 0.5, 1) translate(0, 0)'
        })
    })
    return
  }
  if (!opened) opened = true

  style.zIndex = zIndex()
  translated.x = 0
  translated.y = 0

  nextTick(() => {
    dialogRef.value &&
      setStyles(dialogRef.value, {
        transform: 'scale3d(0.5, 0.5, 1) translate(0, 0)'
      })
    // 先等overlay层动画开始再开始dialog过渡,否则过渡效果不会产生
    nextFrame(() => {
      dialogTransition.enter()
    })
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
  setStyles(dom, { transform: `translate3d(${x}px, ${y}px, 0)` })
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

const { toggleMaximize, maximized } = useMaximum({
  dialogRef,
  cls
})

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
