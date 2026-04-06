<template>
  <div :class="cls.b">
    <slot />
    <sup :class="classList" ref="supRef" v-if="!hidden">{{ badgeValue }}</sup>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'
import type { BadgeProps, ComponentSize } from '@ultra-ui/pc/types'
import { bem, setStyles, zIndex } from '@ultra-ui/core'
import { useFallbackProps } from '@ultra-ui/core'

defineOptions({
  name: 'Badge'
})

const cls = bem('badge')

const props = withDefaults(defineProps<BadgeProps>(), {
  max: 99
})

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const badgeValue = computed(() => {
  if (props.dot) return ''
  return props.value! > props.max ? `${props.max}+` : props.value
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
    const { width, height } = supRef.value.getBoundingClientRect()
    setStyles(supRef.value, {
      transform: `translate(-${width / 2}px, -${height / 2}px)`,
      backgroundColor: props.color && props.color,
      zIndex: zIndex()
    })
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
