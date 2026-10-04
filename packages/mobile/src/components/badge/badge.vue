<template>
  <div :class="cls.b">
    <slot />
    <sup v-if="!hidden" ref="supRef" :class="classList">{{ badgeValue }}</sup>
  </div>
</template>

<script lang="ts" setup>
import { setStyles, zIndex } from '@veltra/utils'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'

import { bem } from '../../shared/bem'
import type { BadgeProps } from '../../types/badge'

defineOptions({ name: 'UBadge' })

const cls = bem('badge')

const props = withDefaults(defineProps<BadgeProps>(), { max: 99 })

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
    cls.m(props.size ?? 'default'),
    bem.is('dot', props.dot)
  ]
})

const supRef = shallowRef<HTMLElement>()

// 角标向内容末端偏移半个自身，实现悬浮角标形态；color/zIndex 需运行时写入
const setPosition = () => {
  if (supRef.value) {
    const { width, height } = supRef.value.getBoundingClientRect()
    setStyles(supRef.value, {
      transform: `translate(-${width / 2}px, -${height / 2}px)`,
      backgroundColor: props.color,
      zIndex: zIndex()
    })
  }
}

watch(
  () => props.size,
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
