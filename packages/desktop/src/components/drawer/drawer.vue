<template>
  <Teleport to="body">
    <transition name="fade" mode="out-in" @enter="onEnter" @after-leave="emit('closed')">
      <div v-if="overlayVisible" :class="overlayCls.b" :style="{ zIndex: zIndex() }" @click="close">
        <transition :name="transitionName" appear @after-leave="onAfterDrawerLeave">
          <div
            v-bind="$attrs"
            v-if="drawerVisible"
            :class="drawerClass"
            :style="drawerStyle"
            @click.stop
          >
            <div v-if="title" :class="cls.e('header')">
              <span :class="cls.e('title')">{{ title }}</span>
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
import { computed, shallowRef } from 'vue'

import type { DrawerProps, DrawerEmits } from '../../types'
import { UIcon } from '../icon'

defineOptions({ name: 'UDrawer', inheritAttrs: false })

const props = withDefaults(defineProps<DrawerProps>(), { direction: 'right' })

const emit = defineEmits<DrawerEmits>()

const cls = bem('drawer')
const overlayCls = bem('drawer-overlay')

const overlayVisible = defineModel<boolean>({ default: false })

const drawerVisible = shallowRef(false)

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
</script>
