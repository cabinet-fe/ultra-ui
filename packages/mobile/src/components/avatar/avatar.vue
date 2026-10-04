<template>
  <span :class="classList">
    <img v-if="src && !errored" :class="cls.e('image')" :src :alt @error="handleError" />
    <span v-else :class="cls.e('fallback')">
      <slot />
    </span>
  </span>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, shallowRef, watch } from 'vue'

import type { AvatarEmits, AvatarProps } from '../../types/avatar'

defineOptions({ name: 'Avatar' })

const { src, alt, shape, size } = defineProps<AvatarProps>()

const emit = defineEmits<AvatarEmits>()

const cls = bem('avatar')

const errored = shallowRef(false)

// 切换 src 时重置错误态，让新地址的图片重新尝试加载
watch(
  () => src,
  () => {
    errored.value = false
  }
)

const classList = computed(() => [
  cls.b,
  cls.m(size ?? 'default'),
  bem.is('round', shape === 'round')
])

function handleError(ev: Event) {
  errored.value = true
  emit('error', ev)
}
</script>
