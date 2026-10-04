<template>
  <span :class="classList">
    <img
      v-if="src && !errored"
      :class="cls.e('image')"
      :src="src"
      :alt="alt"
      @error="handleError"
    />
    <span v-else :class="cls.e('fallback')">
      <slot />
    </span>
  </span>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { computed, shallowRef, watch } from 'vue'

import type { AvatarEmits, AvatarProps, ComponentSize } from '../../types'

defineOptions({ name: 'UAvatar' })

const props = defineProps<AvatarProps>()

const emit = defineEmits<AvatarEmits>()

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const cls = bem('avatar')

const errored = shallowRef(false)

watch(
  () => props.src,
  () => {
    errored.value = false
  }
)

const classList = computed(() => [
  cls.b,
  cls.m(size.value),
  bem.is('round', props.shape === 'round')
])

const handleError = (ev: Event) => {
  errored.value = true
  emit('error', ev)
}
</script>
