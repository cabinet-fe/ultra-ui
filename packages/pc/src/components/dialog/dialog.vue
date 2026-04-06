<template>
  <Teleport to="body">
    <transition
      name="fade"
      @after-leave="emit('closed')"
      @enter="onOverlayEnter"
    >
      <div
        v-if="overlayVisible || opened"
        v-show="overlayVisible"
        :class="[cls.e('overlay'), bem.is('modal', modal)]"
        ref="overlayRef"
        @mousedown="modal && close()"
        @keyup.esc="close"
        tabindex="0"
      >
        <transition name="spring" @after-leave="onAfterDialogLeave">
          <div
            v-if="dialogVisible"
            v-bind="$attrs"
            :class="className"
            ref="dialogRef"
            @mousedown.stop="handleIncreaseZIndex"
          >
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
                  <Minimize />
                </u-icon>
                <u-icon
                  v-else
                  :class="cls.e('btn-maximize')"
                  @click="toggleMaximize(true)"
                  title="最大化"
                >
                  <Maximize />
                </u-icon>
                <u-icon :class="cls.e('btn-close')" @click="close" title="关闭">
                  <X />
                </u-icon>
              </div>
            </section>

            <u-scroll
              tag="section"
              :class="cls.e('body')"
              ref="bodyRef"
              :content-style="{
                height: maximized ? '100%' : undefined
              }"
              @transitionend.stop
              @transitioncancel.stop
            >
              <slot v-bind="{ maximized }" />
            </u-scroll>

            <section ref="footerRef" :class="footerCls" v-if="$slots.footer">
              <slot name="footer" v-bind="{ close }" />
            </section>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>

  <!-- 触发 -->
  <UNodeRender
    @click="visible = !visible"
    :content="getTriggerNode()"
    ref="triggerRef"
  />
</template>

<script lang="ts" setup>
import { shallowRef, watch, computed, provide, nextTick } from 'vue'
import type {
  DialogProps,
  DialogEmits,
  DialogExposed,
  ComponentSize
} from '@ultra-ui/pc/types'
import { bem, extractNormalVNodes, setStyles, zIndex } from '@ultra-ui/core'
import { useDrag, useFallbackProps } from '@ultra-ui/core'
import { UIcon } from '../icon'
import { UScroll } from '../scroll'
import { Maximize, Minimize, X } from 'lucide-vue-next'
import { useMaximum } from './use-maximum'
import { DialogDIKey } from './di'
import { UNodeRender } from '../node-render'
import type { ScrollExposed } from '@ultra-ui/pc/types'

defineOptions({
  name: 'Dialog',
  inheritAttrs: false
})

const props = withDefaults(defineProps<DialogProps>(), {
  modal: true,
  modelValue: true,
  autoScroll: true
})
const emit = defineEmits<DialogEmits>()

const slots = defineSlots<{
  footer?: (props: { close: () => void }) => any
  trigger?: () => any
  header?: () => any
  default?: (props: {
    /** 弹框是否最大化了 */
    maximized: boolean
  }) => any
}>()

const cls = bem('dialog')
const headerCls = [cls.e('header')]
const footerCls = [cls.e('footer')]

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const overlayRef = shallowRef<HTMLDivElement>()

/** 弹框模板引用 */
const dialogRef = shallowRef<HTMLDivElement>()

/** 弹框头部模板引用 */
const headerRef = shallowRef<HTMLDivElement>()

/** 弹框body模板引用 */
const bodyRef = shallowRef<ScrollExposed>()

/** 弹框footer模板引用 */
const footerRef = shallowRef<HTMLDivElement>()

const visible = defineModel<boolean>({
  default: false
})

const overlayVisible = shallowRef(false)
const dialogVisible = shallowRef(false)

watch(visible, v => {
  if (v) {
    overlayVisible.value = true
  } else {
    dialogVisible.value = false
  }
})

function getTriggerNode() {
  const nodes = slots.trigger?.()
  if (!nodes?.length) return null

  const node = extractNormalVNodes(nodes)[0]
  return node
}

function onOverlayEnter() {
  dialogVisible.value = true
}

function onAfterDialogLeave() {
  overlayVisible.value = false
}

const { toggleMaximize, maximized } = useMaximum({
  dialogRef,
  cls
})

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

/**
 * 是否弹出过, 用于控制下一次弹出时是否采用v-show的方式
 */
let opened = false

watch(visible, v => {
  if (!v) return

  if (!opened) opened = true

  // 初始化位置偏移量
  translated.x = 0
  translated.y = 0

  nextTick(() => {
    setStyles(overlayRef.value!, { zIndex: zIndex() })
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
  setStyles(dom, {
    transform: `scale3d(1, 1, 1) translate3d(${x}px, ${y}px, 0)`
  })
}

// 运用拖拽
useDrag({
  target: headerRef,

  onDragStart() {
    handleIncreaseZIndex()
  },

  onDrag({ x, y }) {
    if (maximized.value) return
    updateDialogTransform(translated.x + x, translated.y + y)
  },

  onDragEnd({ x, y }) {
    if (maximized.value) return
    translated.x += x
    translated.y += y

    // 字体模糊的bug修正
    if (translated.x % 2 !== 0) {
      translated.x += x < 0 ? 1 : -1
    }
    if (translated.y % 2 !== 0) {
      translated.y += y < 0 ? 1 : -1
    }
    updateDialogTransform(translated.x, translated.y)
  }
})

function handleIncreaseZIndex() {
  if (props.modal) return
  setStyles(overlayRef.value!, { zIndex: zIndex() })
}

/** 关闭 */
const close = () => {
  visible.value = false
}

provide(DialogDIKey, {
  visible
})

defineExpose<DialogExposed>({
  close
})
</script>
