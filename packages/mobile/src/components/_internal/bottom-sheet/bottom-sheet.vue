<template>
  <Teleport :to="getOverlayContainer()">
    <Transition name="um-sheet" @after-leave="scrollLock.unlock">
      <div v-if="visible" :class="overlayCls" :style="{ zIndex: zIndex() }" @click.self="close">
        <section
          :class="[panelCls, contentClass]"
          :style="contentStyle"
          role="dialog"
          aria-modal="true"
        >
          <header v-if="title || $slots.header" :class="cls.e('header')">
            <slot name="header">
              <span :class="cls.e('title')">{{ title }}</span>
              <button :class="cls.e('close')" type="button" aria-label="关闭" @click="close">
                <Close />
              </button>
            </slot>
          </header>

          <div :class="cls.e('body')">
            <slot />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { Close } from '@veltra/icons/normal'
import { zIndex } from '@veltra/utils'
import { watch } from 'vue'
import type { CSSProperties } from 'vue'

import { bem } from '../../../shared/bem'
import { getOverlayContainer, useOverlayScrollLock } from '../overlay-container'

/**
 * 移动端底部弹层基座（内部组件，不进公开导出）
 *
 * 遮罩 + 底部面板进出场，供 select / multi-select / 后续弹层类组件复用。
 * 面板打开期间锁定背景滚动（body / 设备外壳视口），内容区 `body` 自身可滚，
 * 完全关闭后恢复原滚动位置。
 */
defineOptions({ name: 'UBottomSheet' })

const props = defineProps<{
  /** 是否可见（v-model:visible） */
  visible?: boolean
  /** 头部标题；提供 header 插槽时忽略 */
  title?: string
  /** 面板内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 面板内容容器类名 */
  contentClass?: unknown
}>()

const emit = defineEmits<{ (e: 'update:visible', visible: boolean): void }>()

const cls = bem('sheet')

const overlayCls = cls.b
const panelCls = cls.e('panel')

function close() {
  emit('update:visible', false)
}

const scrollLock = useOverlayScrollLock()

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      scrollLock.lock()
    }
    // 解锁挂在退场过渡 after-leave：动画期间背景保持锁定
  },
  { immediate: true }
)
</script>
