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
    @click="emit('run')"
  >
    <slot />
  </u-button>
</template>

<script lang="ts" setup>
import type { ActionEmits, ActionProps } from '../../types'
import { bem } from '@ultra-ui/utils'
import { UButton } from '../button'
import { computed, inject } from 'vue'
import { ActionDIKey } from './di'
import { UPopConfirm } from '../pop-confirm'
import { omit } from '@ultra-ui/utils'

defineOptions({
  name: 'Action',
  inheritAttrs: false
})

const props = withDefaults(defineProps<ActionProps>(), {
  size: 'small',
  text: true,
  type: 'primary',
  inDropdown: false,
  loading: undefined,
  circle: undefined
})

const buttonProps = computed(() => {
  return omit(props, ['needConfirm', 'loading', 'circle', 'propagate'])
})

const emit = defineEmits<ActionEmits>()

const cls = bem('action')

const ctx = inject(ActionDIKey, undefined)

const loading = computed(() => {
  return props.loading ?? ctx?.groupProps.loading
})

const circle = computed(() => {
  return props.circle ?? ctx?.groupProps.circle
})
function handleConfirm() {
  emit('run')
}
</script>
