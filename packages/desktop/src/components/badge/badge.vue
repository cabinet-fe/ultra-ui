<template>
  <div :class="cls.b">
    <slot />
    <Transition :name="transitionName">
      <sup :class="classList" ref="supRef" v-if="!hidden">{{ badgeValue }}</sup>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { bem, setStyles, zIndex } from '@veltra/utils'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'

import type { BadgeProps, ComponentSize } from '../../types'

defineOptions({ name: 'UBadge' })

const cls = bem('badge')
const transitionName = cls.create('fade').b

const props = withDefaults(defineProps<BadgeProps>(), { max: 99 })

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const badgeValue = computed(() => {
  if (props.dot) return ''
  if (typeof props.value === 'number' && typeof props.max === 'number') {
    return props.value > props.max ? `${props.max}+` : props.value
  }
  return props.value
})

const classList = computed(() => {
  return [
    cls.e('sup'),
    props.type && cls.m('color-' + props.type),
    cls.m(size.value),
    bem.is('dot', props.dot)
  ]
})

const supRef = shallowRef<HTMLElement>()

const setPosition = () => {
  if (supRef.value) {
    // 角标位移（-50%,-50%）由 style.scss 常驻提供，此处仅注入运行时样式
    setStyles(supRef.value, { backgroundColor: props.color, zIndex: zIndex() })
  }
}

watch(
  () => size.value,
  () => {
    nextTick(() => {
      setPosition()
    })
  }
)

onMounted(() => {
  setPosition()
})
</script>
