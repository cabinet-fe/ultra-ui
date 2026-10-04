<template>
  <div :class="cls.e('item')" :aria-hidden="!isActive">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, getCurrentInstance, inject, onBeforeUnmount, onMounted } from 'vue'

import { CarouselDIKey } from './di'

defineOptions({ name: 'UCarouselItem' })

const context = inject(CarouselDIKey, undefined)

const cls = context?.cls ?? bem('carousel')

const uid = getCurrentInstance()?.uid ?? -1

const isActive = computed(
  () => context !== undefined && context.itemUids.value.indexOf(uid) === context.current.value
)

onMounted(() => context?.register(uid))
onBeforeUnmount(() => context?.unregister(uid))
</script>
