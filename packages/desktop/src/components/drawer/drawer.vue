<template>
  <Teleport to="body">
    <transition name="fade" mode="out-in" @enter="onEnter">
      <div
        v-if="overlayVisible"
        :class="overlayCls.b"
        :style="{
          zIndex: zIndex()
        }"
        @click="close"
      >
        <transition
          :name="transitionName"
          appear
          @after-leave="onAfterDrawerLeave"
        >
          <div
            v-bind="$attrs"
            v-if="drawerVisible"
            :class="drawerClass"
            :style="drawerStyle"
            @click.stop
          >
            <span :class="cls.e('close')" @click="close" v-if="showClose">
              <u-icon><Close /></u-icon>
            </span>
            <slot />
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, shallowRef } from 'vue'
import type { DrawerProps, DrawerEmits } from '../../types'
import { bem, zIndex } from '@ultra-ui/utils'
import { UIcon } from '../icon'
import { Close } from '@ultra-ui/icons/normal'

defineOptions({
  name: 'Drawer',
  inheritAttrs: false
})

const props = withDefaults(defineProps<DrawerProps>(), {
  direction: 'right',
  closable: true
})

const emit = defineEmits<DrawerEmits>()

const cls = bem('drawer')
const overlayCls = bem('drawer-overlay')

const overlayVisible = defineModel<boolean>({
  default: false
})

const drawerVisible = shallowRef(false)

// 根据方向计算过渡动画名称
const transitionName = computed(() => {
  return `drawer-slide-${props.direction}`
})

// 计算抽屉样式类
const drawerClass = computed(() => {
  return [cls.b, bem.is(props.direction)]
})

// 计算抽屉样式
const drawerStyle = computed(() => {
  const style: Record<string, string> = {}

  return style
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
