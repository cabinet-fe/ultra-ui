<template>
  <Teleport :to="getOverlayContainer()">
    <transition name="fade" appear @enter="onOverlayEnter" @after-leave="onOverlayLeave">
      <div
        v-if="overlayVisible"
        :class="[cls.e('overlay'), bem.is('modal', modal)]"
        :style="{ zIndex: overlayZIndex }"
        @click="modal && close()"
      >
        <transition :name="transition" appear @after-leave="onAfterDialogLeave">
          <div v-if="dialogVisible" v-bind="$attrs" :class="className" @click.stop>
            <section :class="cls.e('header')">
              <div :class="cls.e('title')">
                <slot name="header">
                  {{ header || title }}
                </slot>
              </div>

              <button :class="cls.e('close')" type="button" aria-label="关闭" @click="close">
                <Close />
              </button>
            </section>

            <section :class="bodyClass">
              <slot />
            </section>

            <!-- 移动端惯例按钮组：等宽铺满、主操作居右；不传插槽时内置取消/确认 -->
            <section :class="footerClass">
              <slot name="footer" v-bind="{ close }">
                <UButton v-if="showCancel" plain @click="onCancel">
                  {{ cancelText }}
                </UButton>
                <UButton type="primary" @click="onConfirm">
                  {{ confirmText }}
                </UButton>
              </slot>
            </section>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>

  <!-- 触发器 -->
  <span v-if="$slots.trigger" :class="cls.e('trigger')" @click="visible = !visible">
    <slot name="trigger" />
  </span>
</template>

<script lang="ts" setup>
import { Close } from '@veltra/icons/normal'
import { zIndex } from '@veltra/utils'
import { computed, shallowRef, watch } from 'vue'

import { bem } from '../../shared/bem'
import type { DialogEmits, DialogProps, _DialogExposed } from '../../types/dialog'
import { getOverlayContainer, useOverlayScrollLock } from '../_internal/overlay-container'
import { UButton } from '../button'

defineOptions({ name: 'UDialog', inheritAttrs: false })

const props = withDefaults(defineProps<DialogProps>(), {
  modal: true,
  transition: 'fade-scale',
  confirmText: '确认',
  cancelText: '取消',
  showCancel: true,
  contentAlign: 'center'
})

const emit = defineEmits<DialogEmits>()

const cls = bem('dialog')

const visible = defineModel<boolean>({ default: false })

const overlayVisible = shallowRef(false)
const dialogVisible = shallowRef(false)
const overlayZIndex = shallowRef<number>()

// 打开期间锁定背景滚动（body / 设备外壳视口），完全关闭后恢复原滚动位置
const scrollLock = useOverlayScrollLock()

// 打开时盖在新一层级上；关闭链路：卡片退场 -> 遮罩退场 -> closed
// immediate：初始即为 true 时直接进入打开态，由 appear 补上进场动画
watch(
  visible,
  (v) => {
    if (v) {
      overlayZIndex.value = zIndex()
      scrollLock.lock()
      overlayVisible.value = true
    } else {
      dialogVisible.value = false
    }
  },
  { immediate: true }
)

function onOverlayEnter() {
  dialogVisible.value = true
}

function onAfterDialogLeave() {
  overlayVisible.value = false
}

/** 遮罩退场完成即整条关闭链路结束：解锁背景滚动并通知 closed */
function onOverlayLeave() {
  scrollLock.unlock()
  emit('closed')
}

const className = computed(() => {
  return [cls.b, bem.is('fullscreen', props.fullscreen)]
})

const bodyClass = computed(() => {
  return [cls.e('body'), bem.is(`align-${props.contentAlign}`, true)]
})

const footerClass = computed(() => {
  return [cls.e('footer'), bem.is('actions-vertical', props.verticalActions)]
})

/** 关闭 */
const close = () => {
  visible.value = false
}

function onCancel() {
  emit('cancel')
  close()
}

function onConfirm() {
  emit('confirm')
  close()
}

defineExpose<_DialogExposed>({ close })
</script>
