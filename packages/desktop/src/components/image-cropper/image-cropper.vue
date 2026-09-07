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

/** 图片变换状态（缩放 / 平移 / 旋转 / 翻转） */
interface TransformState {
  scale: number
  translateX: number
  translateY: number
  /** 90° 步进角度，0 / 90 / 180 / 270 */
  rotation: number
  flipX: boolean
  flipY: boolean
}

const transform = reactive<TransformState>({
  scale: 1,
  translateX: 0,
  translateY: 0,
  rotation: 0,
  flipX: false,
  flipY: false
})

const { selection, initSelection, clearSelection } = useSelection({
  target: selectionRef,
  imageWidth: () => naturalWidth.value,
  imageHeight: () => naturalHeight.value,
  scale: () => transform.scale,
  aspectRatio: () => props.aspectRatio
})

const canvasSize = reactive({ width: 0, height: 0 })

/** 图片加载后按比例适应容器并居中 */
function fitImage() {
  const { width, height } = canvasSize
  if (!width || !height || !naturalWidth.value || !naturalHeight.value) return

  const scale = Math.min(width / naturalWidth.value, height / naturalHeight.value)
  transform.scale = scale
  transform.translateX = (width - naturalWidth.value * scale) / 2
  transform.translateY = (height - naturalHeight.value * scale) / 2
}

/** 重置选区与全部变换状态 */
function resetState() {
  transform.scale = 1
  transform.translateX = 0
  transform.translateY = 0
  transform.rotation = 0
  transform.flipX = false
  transform.flipY = false
  clearSelection()
}

useResizeObserver({
  targets: canvasRef,
  onResize([entry]) {
    if (!entry) return
    canvasSize.width = entry.contentRect.width
    canvasSize.height = entry.contentRect.height
    if (loaded.value) fitImage()
  }
})

watch(
  () => props.src,
  () => {
    resetState()
  }
)

watch(loaded, (isLoaded) => {
  if (!isLoaded) return
  fitImage()
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
