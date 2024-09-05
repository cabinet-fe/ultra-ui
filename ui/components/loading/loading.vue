<template>
  <transition name="fade" appear>
    <div :class="className" :style="{ zIndex: zIndex() }">
      <div :class="cls.e('loader')"></div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import type { LoadingProps } from '@ui/types/components/loading'
import { bem, zIndex } from '@ui/utils'
import { computed } from 'vue'
import { useFallbackProps } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'

defineOptions({
  name: 'Loading'
})

const props = withDefaults(defineProps<LoadingProps>(), {
  type: 'spinner'
})

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const cls = bem('loading')

const className = computed(() => {
  return [cls.b, cls.m(size.value), cls.e(props.type)]
})
</script>
