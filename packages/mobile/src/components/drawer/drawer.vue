<template>
  <Teleport :to="getOverlayContainer()">
    <transition name="fade" appear @enter="onOverlayEnter" @after-leave="emit('closed')">
      <div
        v-if="overlayVisible"
        :class="overlayCls.b"
        :style="{ zIndex: overlayZIndex }"
        @click="close"
      >
        <transition :name="transitionName" appear @after-leave="onAfterDrawerLeave">
          <div
            v-if="drawerVisible"
            v-bind="$attrs"
            :class="drawerClass"
            :style="dragStyle"
            @click.stop
          >
            <!-- 底部形态：拖拽把手，下拉关闭 -->
            <div
              v-if="isBottom"
              :class="cls.e('grabber')"
              @touchstart.passive="onDragStart"
              @touchmove.prevent="onDragMove"
              @touchend.passive="onDragEnd"
              @touchcancel.passive="onDragEnd"
            />

            <div v-if="title || showClose" :class="cls.e('header')">
              <span :class="cls.e('title')">{{ title }}</span>

              <button
                v-if="showClose"
                :class="cls.e('close')"
                type="button"
                aria-label="关闭"
                @click="close"
              >
                <Close />
              </button>
            </div>

            <div :class="cls.e('content')">
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
import { zIndex } from '@veltra/utils'
import { computed, shallowRef, watch } from 'vue'

import { bem } from '../../shared/bem'
import type { DrawerEmits, DrawerProps } from '../../types/drawer'
import { getOverlayContainer } from '../_internal/overlay-container'

defineOptions({ name: 'UDrawer', inheritAttrs: false })

const props = withDefaults(defineProps<DrawerProps>(), { direction: 'right' })

const emit = defineEmits<DrawerEmits>()

const cls = bem('drawer')
const overlayCls = bem('drawer-overlay')

const visible = defineModel<boolean>({ default: false })

const overlayVisible = shallowRef(false)
const drawerVisible = shallowRef(false)
const overlayZIndex = shallowRef<number>()

const isBottom = computed(() => props.direction === 'bottom')

const transitionName = computed(() => `drawer-slide-${props.direction}`)

// 打开时盖在新一层级上；关闭链路：抽屉滑出 -> 遮罩退场 -> closed
watch(
  visible,
  (v) => {
    if (v) {
      overlayZIndex.value = zIndex()
      resetDrag()
      overlayVisible.value = true
    } else {
      drawerVisible.value = false
    }
  },
  { immediate: true }
)

function onOverlayEnter() {
  drawerVisible.value = true
}

function onAfterDrawerLeave() {
  overlayVisible.value = false
}

/** 关闭抽屉：写回 model（emit update:modelValue），滑出经 watch 驱动 */
const close = () => {
  visible.value = false
  emit('close')
}

// ---- 底部形态的下拉关闭（实现细节，不新增公开 API） ----

/** 下拉实时偏移，经 CSS 变量并入滑动过渡，松手回弹或继续滑出 */
const dragY = shallowRef(0)
const dragging = shallowRef(false)
let dragStartY = 0

const dragStyle = computed(() => {
  return dragY.value ? { '--u-drawer-drag': `${dragY.value}px` } : undefined
})

const drawerClass = computed(() => {
  return [cls.b, bem.is(props.direction), bem.is('dragging', dragging.value)]
})

function onDragStart(e: TouchEvent) {
  dragStartY = e.touches[0]!.clientY
  dragging.value = true
}

function onDragMove(e: TouchEvent) {
  const dy = e.touches[0]!.clientY - dragStartY
  // 只跟随向下拉
  dragY.value = Math.max(0, dy)
}

function onDragEnd() {
  dragging.value = false
  if (dragY.value > 100) {
    close()
  } else {
    dragY.value = 0
  }
}

function resetDrag() {
  dragging.value = false
  dragY.value = 0
}
</script>
