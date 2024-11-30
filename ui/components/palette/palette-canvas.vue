<template>
  <!-- 调色画布 -->
  <div :class="cls.e('canvas')" ref="canvasRef">
    <div
      :class="cls.e('canvas-color')"
      :style="{ backgroundImage: canvasBackground }"
    ></div>
    <div :class="cls.e('canvas-gray')"></div>

    <div
      :class="cls.e('canvas-thumb')"
      ref="canvasThumbRef"
      @click.stop
      @mousedown.stop
      :style="canvasThumbStyle"
    ></div>
  </div>
</template>

<script lang="ts" setup>
// 调色画布
// 水平方向表示饱和度，从左到右饱和度逐渐增高
// 垂直方向表示亮度，上亮下暗

import { computed, inject } from 'vue'
import { PaletteDIKey } from './di'
import { useCanvasThumb } from './use-canvas'

defineOptions({
  name: 'PaletteCanvas'
})

const { cls, RGBA } = inject(PaletteDIKey)!

const { canvasRef, canvasThumbRef, canvasThumbStyle } = useCanvasThumb()

const canvasBackground = computed(() => {
  const { r, g, b } = RGBA
  return `linear-gradient(to right, rgb(255, 255, 255), rgb(${r}, ${g}, ${b}))`
})
</script>
