<template>
  <button :class="classList" type="button" ref="buttonRef" @click="handleClick">
    <!-- 加载图标 -->
    <span v-if="loading" :class="[iconCls, bem.is('loading')]" :style="iconStyle">
      <component :is="loadingIcon" />
    </span>

    <!-- 左侧图标 -->
    <span v-else-if="!!icon && iconPosition === 'left'" :class="iconCls" :style="iconStyle">
      <component :is="icon" />
    </span>

    <slot />

    <!-- 右侧图标 -->
    <span v-if="!!icon && iconPosition === 'right'" :class="iconCls" :style="iconStyle">
      <component :is="icon" />
    </span>
  </button>
</template>

<script lang="ts" setup>
import { Loading } from '@veltra/icons'
import { withUnit } from '@veltra/utils'
import { computed, shallowRef } from 'vue'

import { bem } from '../../shared/bem'
import type { ButtonEmits, ButtonProps, _ButtonExposed } from '../../types/button'

defineOptions({ name: 'UButton' })

const props = withDefaults(defineProps<ButtonProps>(), {
  iconPosition: 'left',
  loadingIcon: () => Loading,
  disabled: false,
  propagate: true
})

const emit = defineEmits<ButtonEmits>()

const cls = bem('button')

const classList = computed(() => {
  return [
    cls.b,
    cls.m(props.size ?? 'default'),
    props.type && cls.m('color-' + props.type),
    bem.is('circle', props.circle),
    bem.is('disabled', props.disabled),
    bem.is('loading', props.loading),
    bem.is('plain', props.plain),
    bem.is('text', props.text)
  ]
})

const iconCls = cls.e('icon')

const iconStyle = computed(() => ({ fontSize: withUnit(props.iconSize, 'px') }))

const handleClick = (e: MouseEvent) => {
  if (props.disabled || props.loading) {
    e.stopPropagation()
    return
  }

  !props.propagate && e.stopPropagation()

  emit('click', e)
}

const buttonRef = shallowRef<HTMLButtonElement>()

const exposed: _ButtonExposed = { el: buttonRef }

defineExpose(exposed)
</script>
