<template>
  <div :class="cls.b">
    <div :class="cls.e('canvas')" ref="canvasRef">
      <img
        v-if="loaded"
        :class="cls.e('image')"
        :src="imageUrl"
        :style="imageStyle"
        draggable="false"
        alt=""
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useResizeObserver } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { computed, reactive, shallowRef, watch } from 'vue'

import type { ImageCropperProps, ImageCropperEmits } from '../../types'
import { useImageLoader } from './use-image-loader'

defineOptions({ name: 'ImageCropper' })

const props = withDefaults(defineProps<ImageCropperProps>(), {
  showToolbar: true,
  showPreview: true
})

defineEmits<ImageCropperEmits>()

const cls = bem('image-cropper')

const canvasRef = shallowRef<HTMLElement>()

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

/** 裁剪选区 */
interface SelectionState {
  x: number
  y: number
  width: number
  height: number
}

const transform = reactive<TransformState>({
  scale: 1,
  translateX: 0,
  translateY: 0,
  rotation: 0,
  flipX: false,
  flipY: false
})

const selection = shallowRef<SelectionState | null>(null)

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
  selection.value = null
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
  if (isLoaded) fitImage()
})

const imageStyle = computed(() => {
  const { translateX, translateY, rotation, scale, flipX, flipY } = transform
  return {
    transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${(flipX ? -1 : 1) * scale}, ${(flipY ? -1 : 1) * scale})`
  }
})
</script>
