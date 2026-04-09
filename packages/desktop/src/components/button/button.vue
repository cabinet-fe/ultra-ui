<template>
  <button
    :class="classList"
    type="button"
    aria-label="button"
    ref="buttonRef"
    v-ripple="ripple"
    @click="handleClick"
  >
    <!-- 加载图标 -->
    <u-icon v-if="loading" :class="[bem.is('loading')]" :size="iconSize">
      <component :is="loadingIcon" />
    </u-icon>

    <!-- 左侧图标 -->
    <u-icon v-if="!!icon && iconPosition === 'left' && !loading" :size="iconSize">
      <component :is="icon" />
    </u-icon>

    <slot />

    <!-- 右侧图标 -->
    <u-icon v-if="!!icon && iconPosition === 'right'" :size="iconSize">
      <component :is="icon" />
    </u-icon>
  </button>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@ultra-ui/compositions'
import { vRipple } from '@ultra-ui/directives'
import { Loading } from '@ultra-ui/icons'
import { bem } from '@ultra-ui/utils'
import { computed, shallowRef } from 'vue'

import type { ButtonEmits, ButtonProps, _ButtonExposed, ComponentSize } from '../../types'
import { UIcon } from '../icon'

defineOptions({
  name: 'Button'
})

const props = withDefaults(defineProps<ButtonProps>(), {
  iconPosition: 'left',
  loadingIcon: () => Loading,
  disabled: false,
  propagate: true
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
  if (props.disabled || props.loading) {
    e.stopPropagation()
    return
  }

  !props.propagate && e.stopPropagation()

  emit('click', e)
}

const buttonRef = shallowRef<HTMLButtonElement>()

const exposed: _ButtonExposed = {
  el: buttonRef
}

defineExpose(exposed)
</script>
