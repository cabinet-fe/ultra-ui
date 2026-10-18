<template>
  <Teleport to="body">
    <transition name="fade" @after-leave="emit('closed')" @enter="onOverlayEnter">
      <div
        v-if="overlayVisible || opened"
        v-show="overlayVisible"
        :class="[cls.e('overlay'), bem.is('modal', modal)]"
        ref="overlayRef"
        @mousedown="modal && close()"
      >
        <transition :name="transition" @after-leave="onAfterDialogLeave">
          <div
            v-if="dialogVisible"
            ref="dialogRef"
            :class="className"
            role="dialog"
            :aria-modal="modal ? 'true' : undefined"
            :aria-labelledby="hasTitle ? titleId : undefined"
            tabindex="-1"
            @mousedown.stop="handleIncreaseZIndex"
            v-bind="$attrs"
          >
            <section :class="headerCls" ref="headerRef" @transitionend.stop @transitioncancel.stop>
              <div :id="titleId" :class="cls.e('title')" @mousedown.stop>
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
              :content-style="{ height: maximized ? '100%' : undefined }"
              @transitionend.stop
              @transitioncancel.stop
            >
              <slot v-bind="{ maximized }" />
            </u-scroll>

            <section :class="footerCls" v-if="$slots.footer">
              <slot name="footer" v-bind="{ close }" />
            </section>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>

  <!-- 触发 -->
  <UNodeRender @click="visible = !visible" :content="getTriggerNode()" ref="triggerRef" />
</template>

<script lang="ts" setup>
import { useDrag, useFallbackProps } from '@veltra/compositions'
import { Close, Maximum, Recover } from '@veltra/icons/normal'
import { bem, extractNormalVNodes, setStyles, zIndex } from '@veltra/utils'
import { shallowRef, watch, computed, provide, nextTick, useId } from 'vue'

import { useOverlay } from '../../composables/use-overlay'
import type { DialogProps, DialogEmits, DialogExposed, ComponentSize } from '../../types'
import { UIcon } from '../icon'
import { UNodeRender } from '../node-render'
import { UScroll } from '../scroll'
import { DialogDIKey } from './di'
import { useMaximum } from './use-maximum'

defineOptions({ name: 'UDialog', inheritAttrs: false })

const props = withDefaults(defineProps<DialogProps>(), {
  modal: true,
  modelValue: true,
  autoScroll: true,
  transition: 'fade-scale',
  closeOnEsc: true,
  lockScroll: true
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

/** 标题元素 id，供 aria-labelledby 引用 */
const titleId = useId()

/** 是否渲染了标题，用于决定 aria-labelledby */
const hasTitle = computed(() => Boolean(props.title || props.header || slots.header))

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const overlayRef = shallowRef<HTMLDivElement>()

/** 弹框模板引用 */
const dialogRef = shallowRef<HTMLDivElement>()

/** 弹框头部模板引用 */
const headerRef = shallowRef<HTMLDivElement>()

const visible = defineModel<boolean>({ default: false })

// 初始即打开时没有进入过渡钩子，直接按打开状态渲染（初始挂载不播进入动画）
const overlayVisible = shallowRef(visible.value)
const dialogVisible = shallowRef(visible.value)

watch(visible, (v) => {
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

const { toggleMaximize, maximized } = useMaximum({ dialogRef, cls })

const className = computed(() => {
  return [cls.b, cls.m(size.value)]
})

/** dialog位移的位置 */
const translated = { x: 0, y: 0 }

/**
 * 是否弹出过, 用于控制下一次弹出时是否采用v-show的方式
 */
let opened = false

watch(
  visible,
  (v) => {
    if (!v) return

    if (!opened) opened = true

    // 初始化位置偏移量
    translated.x = 0
    translated.y = 0

    nextTick(() => {
      const overlay = overlayRef.value
      if (overlay) setStyles(overlay, { zIndex: zIndex() })
    })
  },
  { immediate: true }
)

/**
 * 更新弹框位置
 * 使用独立 `translate` 而非整体 `transform`, 与 spring 动画的 `scale` 解耦,
 * 避免动画期间整体 transform 被关键帧覆盖、动画结束后又"啪"地跳回内联位置
 */
const updateDialogTransform = (x: number, y: number) => {
  const dom = dialogRef.value
  if (!dom) return
  setStyles(dom, { translate: `${x}px ${y}px` })
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

// 通用遮罩行为：Esc 关闭、body 滚动锁、焦点圈与焦点恢复
// 非模态弹框不锁滚动、不做焦点圈，避免页面无法滚动或键盘无法离开弹框
useOverlay({
  visible: () => visible.value,
  panel: () => dialogRef.value,
  onClose: close,
  closeOnEsc: () => props.closeOnEsc,
  lockScroll: () => props.lockScroll && props.modal,
  trapFocus: () => props.modal
})

provide(DialogDIKey, { visible })

defineExpose<DialogExposed>({ close })
</script>
