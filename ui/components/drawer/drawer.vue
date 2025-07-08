<template>
  <Teleport to="body">
    <transition :name="transitionName" mode="out-in">
      <div
        v-if="visible"
        :class="overlayCls.b"
        :style="{
          zIndex: zIndex()
        }"
        @click="close"
      >
        <div
          v-bind="$attrs"
          :class="drawerClass"
          :style="drawerStyle"
          @click.stop
        >
          <span :class="cls.e('close')" @click="close" v-if="showClose">
            <u-icon><Close /></u-icon>
          </span>
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { DrawerProps, DrawerEmits } from '@ui/types'
import { bem, zIndex } from '@ui/utils'
import { UIcon } from '../icon'
import { Close } from '@ultra/icon'

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

const visible = defineModel<boolean>({
  default: false
})

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

// 关闭抽屉
const close = () => {
  visible.value = false
  emit('close')
}
</script>
