<template>
  <Teleport :to="getOverlayContainer()">
    <transition name="fade" appear @enter="onOverlayEnter" @after-leave="emit('closed')">
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

            <section :class="cls.e('body')">
              <slot />
            </section>

            <section :class="cls.e('footer')" v-if="$slots.footer">
              <slot name="footer" v-bind="{ close }" />
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
import { getOverlayContainer } from '../_internal/overlay-container'

defineOptions({ name: 'UDialog', inheritAttrs: false })

const props = withDefaults(defineProps<DialogProps>(), { modal: true, transition: 'fade-scale' })

const emit = defineEmits<DialogEmits>()

const cls = bem('dialog')

const visible = defineModel<boolean>({ default: false })

const overlayVisible = shallowRef(false)
const dialogVisible = shallowRef(false)
const overlayZIndex = shallowRef<number>()

// 打开时盖在新一层级上；关闭链路：卡片退场 -> 遮罩退场 -> closed
// immediate：初始即为 true 时直接进入打开态，由 appear 补上进场动画
watch(
  visible,
  (v) => {
    if (v) {
      overlayZIndex.value = zIndex()
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

const className = computed(() => {
  return [cls.b, cls.m(props.size ?? 'default'), bem.is('fullscreen', props.fullscreen)]
})

/** 关闭 */
const close = () => {
  visible.value = false
}

defineExpose<_DialogExposed>({ close })
</script>
