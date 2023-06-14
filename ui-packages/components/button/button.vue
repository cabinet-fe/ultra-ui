<template>
  <button type="button" :class="className" v-bind="$attrs" @click="handleClick">
    <u-icon v-if="loading" :class="[bem.is('loading'), cls.e('icon-left')]">
      <component :is="loadingIcon" />
    </u-icon>

    <u-icon
      v-if="!!icon && iconPosition === 'left' && !loading"
      :class="$slots.default && cls.e('icon-left')"
    >
      <component :is="icon" />
    </u-icon>

    <slot />

    <u-icon
      v-if="!!icon && iconPosition === 'right'"
      :class="$slots.default && cls.e('icon-right')"
    >
      <component :is="icon" />
    </u-icon>
  </button>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import type { ButtonProps } from './button.type'
import { computed } from 'vue'
import { UIcon } from '../icon'
import { Loading } from 'icon-ultra'

defineOptions({
  name: 'UButton'
})

const props = withDefaults(defineProps<ButtonProps>(), {
  size: 'default',
  iconPosition: 'left',
  loadingIcon: () => Loading
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const cls = bem('button')

const className = computed(() => {
  return [
    cls.b,
    cls.m(props.size),
    cls.m(props.type),
    bem.is('circle', props.circle),
    bem.is('disabled', props.disabled || props.loading)
  ]
})

const handleClick = (e: MouseEvent) => {
  if (props.disabled || props.loading) return
  emit('click', e)
}
</script>
