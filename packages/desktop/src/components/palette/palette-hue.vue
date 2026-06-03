<template>
  <div :class="cls.e('hue')" ref="hueRef">
    <span :class="cls.e('hue-thumb')" @click.stop :style="hueThumbStyle"></span>
  </div>
</template>

<script lang="ts" setup>
import { useDrag } from '@veltra/compositions'
import { inject, onMounted } from 'vue'
import { shallowRef, computed } from 'vue'

import { PaletteDIKey } from './di'

defineOptions({ name: 'PaletteHue' })

const { cls, updateHue, HSV, userAction } = inject(PaletteDIKey)!

const hueRef = shallowRef<HTMLElement>()

const transformX = shallowRef(0)
let sliderWidth = 0

const hueThumbStyle = computed(() => {
  return { transform: `translateX(${transformX.value}px)` }
})

const rangeX = [0, 0] as [number, number]

function getSliderWidth() {
  sliderWidth = hueRef.value?.offsetWidth ?? 0
  rangeX[1] = sliderWidth
}

const updateOffsetX = userAction((offsetX: number) => {
  transformX.value = offsetX
  updateHue(Math.round((offsetX / sliderWidth) * 360))
})

const sliderDragger = useDrag({
  target: hueRef,
  rangeX,
  onDrag({ offsetX }) {
    updateOffsetX(offsetX)
  },
  onDragStart(e) {
    getSliderWidth()

    sliderDragger.update({ offsetX: e.offsetX })

    updateOffsetX(e.offsetX)
  }
})

function init(): void {
  getSliderWidth()
  transformX.value = (sliderWidth * HSV.h) / 360
}

onMounted(() => {
  init()
})

defineExpose({ init })
</script>
