<template>
  <u-pop-confirm
    v-if="needConfirm"
    title="确认执行此操作吗？"
    style="display: inline-block"
    direction="left"
    @confirm="handleConfirm"
  >
    <template #reference>
      <u-button
        :class="cls.b"
        :loading
        :circle
        :propagate="false"
        v-bind="{ ...buttonProps, ...$attrs }"
      >
        <slot />
      </u-button>
    </template>
  </u-pop-confirm>

  <u-button
    v-else
    :class="cls.b"
    :loading
    :circle
    :propagate="false"
    v-bind="{ ...buttonProps, ...$attrs }"
    @click="handleRun"
  >
    <slot />
  </u-button>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { bem } from '@veltra/utils'
import { computed, inject } from 'vue'

import type { ActionEmits, ActionProps } from '../../types'
import { UButton } from '../button'
import { UPopConfirm } from '../pop-confirm'
import { ActionDIKey } from './di'

defineOptions({
  name: 'Action',
  inheritAttrs: false
})

// 这里所有可继承自 `<u-action-group>` 的默认值都强制为 `undefined`，
// 否则 Vue 对 Boolean 类型 prop 的默认值（false）会让 `??` 兜底始终失效
const props = withDefaults(defineProps<ActionProps>(), {
  inDropdown: false,
  loading: undefined,
  circle: undefined,
  text: undefined,
  size: undefined,
  type: undefined
})

const ctx = inject(ActionDIKey, undefined)

const size = computed(() => props.size ?? ctx?.groupProps.size ?? 'small')
const text = computed(() => props.text ?? ctx?.groupProps.text ?? true)
const type = computed(() => props.type ?? ctx?.groupProps.type ?? 'primary')

const loading = computed(() => {
  return props.loading ?? ctx?.groupProps.loading
})

// 下拉菜单中的操作项强制非圆形以呈现完整文本，否则跟随用户/分组配置
const circle = computed(() => {
  if (props.inDropdown) return false
  return props.circle ?? ctx?.groupProps.circle
})

const buttonProps = computed(() => {
  return {
    ...o(props as Record<string, any>).omit([
      'needConfirm',
      'loading',
      'circle',
      'propagate',
      'size',
      'text',
      'type',
      'inDropdown'
    ]),
    size: size.value,
    text: text.value,
    type: type.value
  }
})

const emit = defineEmits<ActionEmits>()

const cls = bem('action')

function handleConfirm() {
  handleRun()
}

function handleRun() {
  emit('run')

  if (props.inDropdown) {
    ctx?.closeTip()
  }
}
</script>
