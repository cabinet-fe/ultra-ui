<template>
  <transition name="fade" appear>
    <div :class="className" :style="{ zIndex: zIndex() }">
      <div :class="cls.e('loader')"></div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { bem, zIndex } from '@veltra/utils'
import { computed } from 'vue'

import type { LoadingProps, ComponentSize } from '../../types'

defineOptions({ name: 'ULoading' })

const props = withDefaults(defineProps<LoadingProps>(), { type: 'dual-ring' })

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const cls = bem('loading')

const className = computed(() => {
  return [cls.b, cls.m(size.value), cls.e(props.type)]
})
</script>
