<template>
  <!-- 调色画布 -->
  <div :class="cls.e('sv')" ref="svRef">
    <div
      :class="cls.e('sv-s')"
      :style="{ backgroundImage: canvasBackground }"
    ></div>
    <div :class="cls.e('sv-v')">{{ hue }}</div>

    <div
      :class="cls.e('sv-thumb')"
      ref="svThumbRef"
      @click.stop
      @mousedown.stop
      :style="svThumbStyle"
    ></div>
  </div>
</template>

<script lang="ts" setup>
// 调色画布
// 水平方向表示饱和度，从左到右饱和度逐渐增高
// 垂直方向表示亮度，上亮下暗

import { computed, inject } from 'vue'
import { PaletteDIKey } from './di'
import { useSV } from './use-sv'

defineOptions({
  name: 'PaletteCanvas'
})

const { cls, hue } = inject(PaletteDIKey)!

const { svRef, svThumbRef, svThumbStyle } = useSV()

const canvasBackground = computed(() => {
  const { r, g, b } = hue
  return `linear-gradient(to right, rgb(255, 255, 255), rgb(${r}, ${g}, ${b}))`
})
</script>
