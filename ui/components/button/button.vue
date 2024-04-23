<template>
  <button
    :class="classList"
    type="button"
    v-bind="$attrs"
    aria-label="button"
    @click="handleClick"
    ref="buttonRef"
    v-ripple="ripple"
  >
    <!-- 加载图标 -->
    <u-icon
      v-if="loading"
      :class="[bem.is('loading'), $slots.default ? cls.e('icon-left') : null]"
      :size="iconSize"
    >
      <component :is="loadingIcon" />
    </u-icon>

    <!-- 左侧图标 -->
    <u-icon
      v-if="!!icon && iconPosition === 'left' && !loading"
      :class="$slots.default && cls.e('icon-left')"
      :size="iconSize"
    >
      <component :is="icon" />
    </u-icon>

    <slot />

    <!-- 右侧图标 -->
    <u-icon
      v-if="!!icon && iconPosition === 'right'"
      :class="$slots.default && cls.e('icon-right')"
      :size="iconSize"
    >
      <component :is="icon" />
    </u-icon>
  </button>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'
import type {
  ButtonEmits,
  ButtonProps,
  _ButtonExposed
} from '@ui/types/components/button'
import { computed, shallowRef } from 'vue'
import { UIcon } from '../icon'
import { Loading } from 'icon-ultra'
import { vRipple } from '@ui/directives'
import { useFallbackProps } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'

defineOptions({
  name: 'Button'
})

const props = withDefaults(defineProps<ButtonProps>(), {
  iconPosition: 'left',
  loadingIcon: () => Loading
})

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const emit = defineEmits<ButtonEmits>()

const cls = bem('button')

const classList = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    props.type && cls.m('color-' + props.type),
    bem.is('circle', props.circle),
    bem.is('disabled', props.disabled),
    bem.is('loading', props.loading),
    bem.is('plain', props.plain),
    bem.is('text', props.text)
  ]
})

const ripple = computed(() => {
  if (props.disabled || props.loading) return false
  if ((props.plain || props.text) && props.type) {
    return bem.is(`ripple-${props.type}`)
  }
  return true
})

const handleClick = (e: MouseEvent) => {
  if (props.disabled || props.loading) return
  emit('click', e)
}

const buttonRef = shallowRef<HTMLButtonElement>()

const exposed: _ButtonExposed = {
  el: buttonRef
}

defineExpose(exposed)
</script>
