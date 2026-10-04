<template>
  <div :class="cls.b" role="region" aria-roledescription="carousel">
    <div :class="cls.e('track')" :style="trackStyle">
      <slot />
    </div>

    <button
      v-if="arrows"
      type="button"
      :class="[cls.e('arrow'), cls.em('arrow', 'prev')]"
      :disabled="!canPrev"
      aria-label="上一页"
      @click="prev"
    >
      <u-icon><ArrowLeft /></u-icon>
    </button>

    <button
      v-if="arrows"
      type="button"
      :class="[cls.e('arrow'), cls.em('arrow', 'next')]"
      :disabled="!canNext"
      aria-label="下一页"
      @click="next"
    >
      <u-icon><ArrowRight /></u-icon>
    </button>

    <div v-if="dots" :class="cls.e('dots')">
      <button
        v-for="page in itemUids.length"
        :key="page"
        type="button"
        :class="[cls.e('dot'), bem.is('active', page - 1 === current)]"
        :aria-label="`切换到第 ${page} 页`"
        @click="goTo(page - 1)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowLeft, ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, provide, ref, watch } from 'vue'

import type { CarouselEmits, CarouselProps } from '../../types'
import { UIcon } from '../icon'
import { CarouselDIKey } from './di'
import { useCarousel } from './use-carousel'

defineOptions({ name: 'UCarousel' })

const {
  autoplay = false,
  interval = 3000,
  loop = true,
  arrows = false,
  dots = true
} = defineProps<CarouselProps>()

const emit = defineEmits<CarouselEmits>()

const cls = bem('carousel')

const model = defineModel<number>('activeIndex', { default: 0 })

/** 已注册页 uid，顺序即插槽渲染顺序，页数由此推导 */
const itemUids = ref<number[]>([])

const register = (uid: number) => {
  if (!itemUids.value.includes(uid)) itemUids.value.push(uid)
}

const unregister = (uid: number) => {
  const index = itemUids.value.indexOf(uid)
  if (index > -1) itemUids.value.splice(index, 1)
}

const { current, canPrev, canNext, goTo, prev, next } = useCarousel({
  model,
  count: () => itemUids.value.length,
  autoplay: () => autoplay,
  interval: () => interval,
  loop: () => loop
})

provide(CarouselDIKey, { cls, itemUids, current, register, unregister })

const trackStyle = computed(() => ({ transform: `translateX(-${current.value * 100}%)` }))

watch(model, (index, prevIndex) => emit('change', index, prevIndex))
</script>
