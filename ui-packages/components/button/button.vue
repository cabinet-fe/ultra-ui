<template>
  <button
    type="button"
    :class="className"
    v-bind="$attrs"
    @click="handleClick"
    v-ripple="ripple"
  >
    <!-- 加载图标 -->
    <u-icon v-if="loading" :class="[bem.is('loading'), cls.e('icon-left')]">
      <component :is="loadingIcon" />
    </u-icon>

    <!-- 左侧图标 -->
    <u-icon
      v-if="!!icon && iconPosition === 'left' && !loading"
      :class="$slots.default && cls.e('icon-left')"
    >
      <component :is="icon" />
    </u-icon>

    <slot />

    <!-- 右侧图标 -->
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
import type { ButtonEmits, ButtonProps } from './button.type'
import { computed } from 'vue'
import { UIcon } from '../icon'
import { Loading } from 'icon-ultra'
import { vRipple } from '@ui/directives'

defineOptions({
  name: 'UButton'
})

const props = withDefaults(defineProps<ButtonProps>(), {
  size: 'default',
  iconPosition: 'left',
  loadingIcon: () => Loading
})

const emit = defineEmits<ButtonEmits>()

const cls = bem('button')

const className = computed(() => {
  return [
    cls.b,
    cls.m(props.size),
    props.type && cls.m(props.type),
    bem.is('circle', props.circle),
    bem.is('disabled', props.disabled),
    bem.is('loading', props.loading),
    bem.is('plain', props.plain),
    bem.is('text', props.text)
  ]
})

const ripple = computed(() => {
  if (props.disabled || props.loading) return false
  if (!(props.plain && props.type)) return true
  return bem.is(`ripple-${props.type}`)
})

const handleClick = (e: MouseEvent) => {
  if (props.disabled || props.loading) return
  emit('click', e)
}
</script>
