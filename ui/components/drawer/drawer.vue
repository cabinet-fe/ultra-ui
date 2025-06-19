<template>
  <Teleport to="body">
    <transition name="fade" @after-leave="emit('closed')">
      <div
        v-if="visible || opened"
        v-show="visible"
        :class="[cls.e('overlay'), bem.is('modal', modal)]"
        :style="{ zIndex: currentZIndex }"
        ref="overlayRef"
        @mousedown="handleOverlayClick"
        @keyup.esc="close"
        tabindex="0"
      >
        <transition :name="transitionName">
          <div
            v-show="visible"
            v-bind="$attrs"
            :class="drawerClass"
            :style="drawerStyle"
            ref="drawerRef"
            @mousedown.stop
          >
            <!-- 头部 -->
            <div
              v-if="title || closable || $slots.header"
              :class="cls.e('header')"
            >
              <div :class="cls.e('title')">
                <slot name="header">
                  {{ title }}
                </slot>
              </div>
              <u-icon
                v-if="closable"
                :class="cls.e('close')"
                @click="close"
                title="关闭"
              >
                <Close />
              </u-icon>
            </div>

            <!-- 内容 -->
            <div :class="cls.e('body')">
              <slot />
            </div>

            <!-- 底部 -->
            <div v-if="$slots.footer" :class="cls.e('footer')">
              <slot name="footer" />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, shallowRef, watch, nextTick } from 'vue'
import type { DrawerProps, DrawerEmits, DrawerExposed } from '@ui/types'
import { bem, zIndex } from '@ui/utils'
import { UIcon } from '../icon'
import { Close } from 'icon-ultra'

defineOptions({
  name: 'Drawer',
  inheritAttrs: false
})

const props = withDefaults(defineProps<DrawerProps>(), {
  direction: 'right',
  mode: 'edge',
  modal: true,
  maskClosable: true,
  closable: true,
  size: 300
})

const emit = defineEmits<DrawerEmits>()

const cls = bem('drawer')

const overlayRef = shallowRef<HTMLDivElement>()
const drawerRef = shallowRef<HTMLDivElement>()

const visible = defineModel<boolean>({
  default: false
})

// 当前z-index
const currentZIndex = shallowRef(0)

// 是否曾经打开过
let opened = false

// 根据方向计算过渡动画名称
const transitionName = computed(() => {
  return `slide-${props.direction}`
})

// 计算抽屉样式类
const drawerClass = computed(() => {
  return [cls.b, cls.m(props.direction), cls.m(props.mode)]
})

// 计算抽屉样式
const drawerStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props.direction === 'left' || props.direction === 'right') {
    style.width =
      typeof props.size === 'number' ? `${props.size}px` : props.size
  } else {
    style.height =
      typeof props.size === 'number' ? `${props.size}px` : props.size
  }

  return style
})

// 处理遮罩层点击
const handleOverlayClick = (e: MouseEvent) => {
  if (!props.maskClosable || !props.modal) return
  if (e.target === overlayRef.value) {
    close()
  }
}

// 关闭抽屉
const close = () => {
  visible.value = false
  emit('close')
}

// 监听显示状态变化
watch(
  visible,
  v => {
    if (v) {
      if (!opened) opened = true
      document.body.classList.add(cls.m('opened'))
      currentZIndex.value = props.zIndex || zIndex()
    } else {
      document.body.classList.remove(cls.m('opened'))
    }
  },
  { immediate: true }
)

defineExpose<DrawerExposed>({
  close
})
</script>
