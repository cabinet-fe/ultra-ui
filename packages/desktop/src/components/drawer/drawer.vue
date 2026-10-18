<template>
  <Teleport to="body">
    <transition name="fade" mode="out-in" @enter="onEnter" @after-leave="emit('closed')">
      <div v-if="overlayVisible" :class="overlayCls.b" :style="{ zIndex: zIndex() }" @click="close">
        <transition :name="transitionName" appear @after-leave="onAfterDrawerLeave">
          <div
            v-if="drawerVisible"
            ref="panelRef"
            :class="drawerClass"
            :style="drawerStyle"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? titleId : undefined"
            tabindex="-1"
            @click.stop
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
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { Close } from '@veltra/icons/normal'
import { bem, zIndex } from '@veltra/utils'
import { computed, shallowRef, useId } from 'vue'

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

const overlayVisible = defineModel<boolean>({ default: false })

const drawerVisible = shallowRef(false)

/** 标题元素 id，供 aria-labelledby 引用 */
const titleId = useId()

/** 抽屉面板模板引用，用于初始聚焦与焦点圈 */
const panelRef = shallowRef<HTMLElement>()

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

const onEnter = () => {
  drawerVisible.value = true
}

const onAfterDrawerLeave = () => {
  overlayVisible.value = false
}

// 关闭抽屉
const close = () => {
  drawerVisible.value = false
  emit('close')
}

// 通用遮罩行为：Esc 关闭、body 滚动锁、焦点圈与焦点恢复
useOverlay({
  visible: () => overlayVisible.value && drawerVisible.value,
  panel: () => panelRef.value,
  onClose: close,
  closeOnEsc: () => props.closeOnEsc,
  lockScroll: () => props.lockScroll
})
</script>
