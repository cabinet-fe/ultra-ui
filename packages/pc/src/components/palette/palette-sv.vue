<template>
  <!-- 调色画布 -->
  <div :class="cls.e('sv')" ref="svRef">
    <div
      :class="cls.e('sv-s')"
      :style="{ backgroundImage: canvasBackground }"
    ></div>
    <div :class="cls.e('sv-v')">{{}}</div>

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
import { computed, inject, reactive, shallowRef, onMounted } from 'vue'
import { PaletteDIKey } from './di'
import { useDrag } from '@ultra-ui/core'

defineOptions({
  name: 'PaletteSV'
})

const { cls, hueRGB, HSV, updateSV, updater } = inject(PaletteDIKey)!

const svRef = shallowRef<HTMLDivElement>()

const canvasSize = {
  width: 0,
  height: 0
}

const rangeX = [0, 0] as [number, number]
const rangeY = [0, 0] as [number, number]

const getCanvasSize = () => {
  if (!svRef.value) return
  const { offsetHeight, offsetWidth } = svRef.value!

  canvasSize.width = offsetWidth
  rangeX[1] = offsetWidth

  canvasSize.height = offsetHeight
  rangeY[1] = offsetHeight
}

const transform = reactive({
  x: 0,
  y: 0
})

const svThumbStyle = computed(() => {
  return {
    transform: `translate(${transform.x}px, ${transform.y}px)`
  }
})

function updateThumb(offsetX: number, offsetY: number) {
  updater.updateAndLock(() => {
    transform.x = offsetX
    transform.y = offsetY

    // 根据画布位置计算饱和度和亮度
    // 水平方向表示饱和度，从左到右饱和度逐渐增高
    // 垂直方向表示亮度，上亮下暗
    const s = Math.max(0, Math.min(1, offsetX / canvasSize.width))
    const v = Math.max(0, Math.min(1, 1 - offsetY / canvasSize.height))

    // 更新饱和度和亮度
    updateSV({ s, v })
  })
}

const svDragger = useDrag({
  target: svRef,
  rangeX,
  rangeY,

  onDrag({ offsetX, offsetY }) {
    updateThumb(offsetX, offsetY)
  },
  onDragStart(e) {
    getCanvasSize()

    const { offsetX, offsetY } = e

    updateThumb(offsetX, offsetY)

    svDragger.update({ offsetX, offsetY })
  }
})

const canvasBackground = computed(() => {
  const { r, g, b } = hueRGB.value
  return `linear-gradient(to right, rgb(255, 255, 255), rgb(${r}, ${g}, ${b}))`
})

function init(): void {
  getCanvasSize()
  transform.x = canvasSize.width * HSV.s
  transform.y = canvasSize.height * (1 - HSV.v)
}

onMounted(() => {
  init()
})

defineExpose({
  init
})
</script>
