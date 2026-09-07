<template>
  <div :class="cls.b">
    <div :class="cls.e('canvas')" ref="canvasRef">
      <div v-if="loaded" :class="cls.e('stage')" :style="stageStyle">
        <img :class="cls.e('image')" :src="imageUrl" draggable="false" alt="" />

        <template v-if="selection">
          <!-- 选区外半透明遮罩 -->
          <div v-for="(style, i) in maskStyles" :key="i" :class="cls.e('mask')" :style="style" />

          <!-- 裁剪选区：整体拖动 + 8 个手柄调整大小 -->
          <div :class="cls.e('selection')" ref="selectionRef" :style="selectionStyle">
            <!-- 3×3 网格线，顺序对应 style.scss 中 nth-child 的定位 -->
            <i v-for="i in 4" :key="i" :class="cls.e('grid-line')" />
            <i
              v-for="handle in SELECTION_HANDLES"
              :key="handle"
              :class="cls.e('handle')"
              :data-handle="handle"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useResizeObserver } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { computed, reactive, shallowRef, watch } from 'vue'

import type { ImageCropperProps, ImageCropperEmits } from '../../types'
import { useImageLoader } from './use-image-loader'
import { SELECTION_HANDLES, useSelection } from './use-selection'
import { useTransform } from './use-transform'

defineOptions({ name: 'ImageCropper' })

const props = withDefaults(defineProps<ImageCropperProps>(), {
  showToolbar: true,
  showPreview: true
})

defineEmits<ImageCropperEmits>()

const cls = bem('image-cropper')

const canvasRef = shallowRef<HTMLElement>()
const selectionRef = shallowRef<HTMLElement>()

const { imageUrl, loaded, naturalWidth, naturalHeight } = useImageLoader({ src: () => props.src })

const canvasSize = reactive({ width: 0, height: 0 })

// zoomIn / zoomOut / zoomTo / rotate / flip / resetTransform 由 P4 工具栏接线
const { transform, fit, reset, toImageDelta } = useTransform({
  target: canvasRef,
  canvasSize: () => canvasSize,
  imageWidth: () => naturalWidth.value,
  imageHeight: () => naturalHeight.value,
  onReset: () => initSelection()
})

const { selection, initSelection, clearSelection } = useSelection({
  target: selectionRef,
  imageWidth: () => naturalWidth.value,
  imageHeight: () => naturalHeight.value,
  toImageDelta,
  aspectRatio: () => props.aspectRatio
})

useResizeObserver({
  targets: canvasRef,
  onResize([entry]) {
    if (!entry) return
    canvasSize.width = entry.contentRect.width
    canvasSize.height = entry.contentRect.height
    if (loaded.value) fit()
  }
})

watch(
  () => props.src,
  () => {
    reset()
    clearSelection()
  }
)

watch(loaded, (isLoaded) => {
  if (!isLoaded) return
  fit()
  initSelection()
})

/** 舞台样式：图片与选区层共用同一变换，选区以图片像素坐标定位 */
const stageStyle = computed(() => {
  const { translateX, translateY, rotation, scale, flipX, flipY } = transform
  return {
    width: `${naturalWidth.value}px`,
    height: `${naturalHeight.value}px`,
    transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${(flipX ? -1 : 1) * scale}, ${(flipY ? -1 : 1) * scale})`,
    // 逆缩放系数：选区边框 / 网格线 / 手柄在缩放后保持屏幕恒定尺寸
    '--u-image-cropper-inv-scale': String(1 / scale)
  }
})

const selectionStyle = computed(() => {
  const sel = selection.value
  if (!sel) return {}
  return {
    left: `${sel.x}px`,
    top: `${sel.y}px`,
    width: `${sel.width}px`,
    height: `${sel.height}px`
  }
})

/** 选区外上 / 下 / 左 / 右四向遮罩 */
const maskStyles = computed(() => {
  const sel = selection.value
  if (!sel) return []
  const W = naturalWidth.value
  const H = naturalHeight.value
  const right = sel.x + sel.width
  const bottom = sel.y + sel.height
  return [
    { left: '0px', top: '0px', width: `${W}px`, height: `${sel.y}px` },
    { left: '0px', top: `${bottom}px`, width: `${W}px`, height: `${H - bottom}px` },
    { left: '0px', top: `${sel.y}px`, width: `${sel.x}px`, height: `${sel.height}px` },
    { left: `${right}px`, top: `${sel.y}px`, width: `${W - right}px`, height: `${sel.height}px` }
  ]
})
</script>
