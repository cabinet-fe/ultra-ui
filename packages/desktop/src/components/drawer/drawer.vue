<template>
  <Teleport to="body">
    <transition name="drawer-fade" appear>
      <div v-if="visible" :class="overlayCls.b" :style="{ zIndex: layer }" @click="close" />
    </transition>
    <transition :name="transitionName" appear @after-leave="onAfterLeave">
      <div
        v-if="visible"
        ref="panelRef"
        :class="drawerClass"
        :style="[drawerStyle, { zIndex: layer }]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        tabindex="-1"
        v-bind="$attrs"
      >
        <div v-if="title" :class="cls.e('header')">
          <span :id="titleId" :class="cls.e('title')">{{ title }}</span>
        </div>
        <span :class="cls.e('close')" @click="close" v-if="showClose">
          <u-icon><Close /></u-icon>
        </span>
        <div :class="cls.e('body')">
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { Close } from '@veltra/icons/normal'
import { bem, zIndex } from '@veltra/utils'
import { computed, shallowRef, useId, useTemplateRef, watch } from 'vue'

import { useOverlay } from '../../composables/use-overlay'
import type { DrawerProps, DrawerEmits } from '../../types'
import { UIcon } from '../icon'

defineOptions({ name: 'UDrawer', inheritAttrs: false })

const props = withDefaults(defineProps<DrawerProps>(), {
  direction: 'right',
  closeOnEsc: true,
  lockScroll: true
})

const emit = defineEmits<DrawerEmits>()

const cls = bem('drawer')
const overlayCls = bem('drawer-overlay')

const visible = defineModel<boolean>({ default: false })

/**
 * 遮罩与面板共用的层级，每次打开时取一次。
 * 面板与插槽同处一个 transition，模板里直接调 zIndex() 会随插槽重渲染不断递增
 */
const layer = shallowRef(0)

watch(
  visible,
  (v) => {
    if (v) layer.value = zIndex()
  },
  { immediate: true }
)

/** 标题元素 id，供 aria-labelledby 引用 */
const titleId = useId()

/** 抽屉面板模板引用，用于初始聚焦与焦点圈 */
const panelRef = useTemplateRef<HTMLElement>('panelRef')

// 根据方向计算过渡动画名称
const transitionName = computed(() => {
  return `drawer-slide-${props.direction}`
})

// 计算抽屉样式类
const drawerClass = computed(() => {
  return [cls.b, bem.is(props.direction)]
})

// 计算抽屉样式：size 左右方向映射为宽度、上下方向映射为高度
const drawerStyle = computed(() => {
  const { size, direction } = props
  if (size == null) return null

  const dimension = typeof size === 'number' ? `${size}px` : size
  const axis = direction === 'top' || direction === 'bottom' ? 'height' : 'width'
  return { [axis]: dimension }
})

const onAfterLeave = () => {
  // 退出过程中再次打开会取消 leave，不应把仍打开的抽屉当成已关闭
  if (visible.value) return
  emit('closed')
}

// 立刻同步 v-model，退出动画由 v-if 变 false 驱动；动画期间再次打开能取消退出
const close = () => {
  if (!visible.value) return
  visible.value = false
  emit('close')
}

// 通用遮罩行为：Esc 关闭、body 滚动锁、焦点圈与焦点恢复
useOverlay({
  visible: () => visible.value,
  panel: () => panelRef.value ?? undefined,
  onClose: close,
  closeOnEsc: () => props.closeOnEsc,
  lockScroll: () => props.lockScroll
})
</script>
