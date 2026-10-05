<template>
  <Teleport :to="getOverlayContainer()">
    <transition name="fade" appear @enter="onOverlayEnter" @after-leave="onOverlayLeave">
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
            <!-- 边缘拖拽把手：上/下为整行横把手，左/右为内沿居中的竖把手 -->
            <div
              :class="cls.e('grabber')"
              @touchstart.passive="dragHandlers.touchstart"
              @touchmove.prevent="dragHandlers.touchmove"
              @touchend.passive="dragHandlers.touchend"
              @touchcancel.passive="dragHandlers.touchcancel"
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
import { shouldCloseByDrag, useTouchGesture } from '../../shared/use-touch-gesture'
import type { DrawerEmits, DrawerPlacement, DrawerProps } from '../../types/drawer'
import { getOverlayContainer, useOverlayScrollLock } from '../_internal/overlay-container'

defineOptions({ name: 'UDrawer', inheritAttrs: false })

const props = withDefaults(defineProps<DrawerProps>(), { placement: 'bottom' })

const emit = defineEmits<DrawerEmits>()

const cls = bem('drawer')
const overlayCls = bem('drawer-overlay')

const visible = defineModel<boolean>({ default: false })

const overlayVisible = shallowRef(false)
const drawerVisible = shallowRef(false)
const overlayZIndex = shallowRef<number>()

const transitionName = computed(() => `drawer-slide-${props.placement}`)

// 打开期间锁定背景滚动（body / 设备外壳视口），完全关闭后恢复原滚动位置
const scrollLock = useOverlayScrollLock()

// 打开时盖在新一层级上；关闭链路：抽屉滑出 -> 遮罩退场 -> closed
watch(
  visible,
  (v) => {
    if (v) {
      overlayZIndex.value = zIndex()
      resetDrag()
      scrollLock.lock()
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

/** 遮罩退场完成即整条关闭链路结束：解锁背景滚动并通知 closed */
function onOverlayLeave() {
  scrollLock.unlock()
  emit('closed')
}

/** 关闭抽屉：写回 model（emit update:modelValue），滑出经 watch 驱动 */
const close = () => {
  visible.value = false
  emit('close')
}

// ---- 四向边缘拖拽关闭（实现细节，不新增公开 API） ----

/** 各方位沿关闭方向拖拽的轴与符号：bottom 下拉 / top 上推 / left 左拖 / right 右拖 */
const DRAG_DISMISS: Record<DrawerPlacement, { axis: 'x' | 'y'; sign: 1 | -1 }> = {
  bottom: { axis: 'y', sign: 1 },
  top: { axis: 'y', sign: -1 },
  left: { axis: 'x', sign: -1 },
  right: { axis: 'x', sign: 1 }
}

/** 沿关闭方向的实时偏移，经 CSS 变量并入滑动过渡，松手回弹或继续滑出 */
const dragOffset = shallowRef(0)
const dragging = shallowRef(false)

const dragStyle = computed(() => {
  return dragOffset.value ? { '--u-drawer-drag': `${dragOffset.value}px` } : undefined
})

const drawerClass = computed(() => {
  return [cls.b, bem.is(props.placement), bem.is('dragging', dragging.value)]
})

const dragHandlers = useTouchGesture({
  onStart() {
    dragging.value = true
  },
  onMove(state) {
    const { axis, sign } = DRAG_DISMISS[props.placement]
    // 只跟随朝关闭方向的分量，反方向拖动面板不动
    dragOffset.value = Math.max(0, sign * (axis === 'x' ? state.dx : state.dy))
  },
  onEnd(state) {
    dragging.value = false
    const { axis, sign } = DRAG_DISMISS[props.placement]
    if (shouldCloseByDrag(state, { axis, sign })) {
      close()
    } else {
      dragOffset.value = 0
    }
  },
  onCancel() {
    // 手势被打断（来电、落到多指等）：回弹而不是关闭
    dragging.value = false
    dragOffset.value = 0
  }
})

function resetDrag() {
  dragging.value = false
  dragOffset.value = 0
}
</script>
