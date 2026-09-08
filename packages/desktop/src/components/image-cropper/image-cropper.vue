<template>
  <div :class="cls.b">
    <div v-if="showToolbar" :class="cls.e('toolbar')">
      <slot
        name="toolbar"
        :zoom-in="zoomIn"
        :zoom-out="zoomOut"
        :rotate="rotate"
        :flip="flip"
        :reset="resetTransform"
        :set-aspect-ratio="setAspectRatio"
        :aspect-ratio="currentRatio"
      >
        <!-- 宽高比预设 -->
        <div :class="cls.e('tool-group')">
          <button
            v-for="preset in RATIO_PRESETS"
            :key="preset.label"
            type="button"
            :class="[cls.e('tool'), bem.is('active', preset.value === currentRatio)]"
            @click="setAspectRatio(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>

        <!-- 缩放 / 旋转 / 翻转 / 重置 -->
        <div :class="cls.e('tool-group')">
          <button
            type="button"
            :class="[cls.e('tool'), cls.em('tool', 'icon')]"
            aria-label="缩小"
            title="缩小"
            @click="zoomOut()"
          >
            <u-icon :size="15"><ZoomOut /></u-icon>
          </button>
          <button
            type="button"
            :class="[cls.e('tool'), cls.em('tool', 'icon')]"
            aria-label="放大"
            title="放大"
            @click="zoomIn()"
          >
            <u-icon :size="15"><ZoomIn /></u-icon>
          </button>
          <button
            type="button"
            :class="[cls.e('tool'), cls.em('tool', 'icon')]"
            aria-label="逆时针旋转 90°"
            title="逆时针旋转 90°"
            @click="rotate(-1)"
          >
            <u-icon :size="15"><RotateLeft /></u-icon>
          </button>
          <button
            type="button"
            :class="[cls.e('tool'), cls.em('tool', 'icon')]"
            aria-label="顺时针旋转 90°"
            title="顺时针旋转 90°"
            @click="rotate(1)"
          >
            <u-icon :size="15"><RotateRight /></u-icon>
          </button>
          <button
            type="button"
            :class="[cls.e('tool'), cls.em('tool', 'icon')]"
            aria-label="水平翻转"
            title="水平翻转"
            @click="flip('horizontal')"
          >
            <u-icon :size="15" :class="cls.e('flip-icon')"><ArrowUpdown /></u-icon>
          </button>
          <button
            type="button"
            :class="[cls.e('tool'), cls.em('tool', 'icon')]"
            aria-label="垂直翻转"
            title="垂直翻转"
            @click="flip('vertical')"
          >
            <u-icon :size="15"><ArrowUpdown /></u-icon>
          </button>
          <button
            type="button"
            :class="[cls.e('tool'), cls.em('tool', 'icon')]"
            aria-label="重置"
            title="重置"
            @click="resetTransform()"
          >
            <u-icon :size="15"><Refresh /></u-icon>
          </button>
        </div>
      </slot>
    </div>

    <div :class="cls.e('canvas')" ref="canvasRef">
      <div v-if="loaded" :class="cls.e('stage')" :style="stageStyle">
        <img :class="cls.e('image')" :src="imageUrl" ref="imageRef" draggable="false" alt="" />

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

    <div v-if="showPreview && loaded" :class="cls.e('preview')">
      <canvas :class="cls.e('preview-canvas')" ref="previewCanvasRef" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useResizeObserver } from '@veltra/compositions'
import {
  ArrowUpdown,
  Refresh,
  RotateLeft,
  RotateRight,
  ZoomIn,
  ZoomOut
} from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, reactive, shallowRef, watch } from 'vue'

import type {
  ImageCropperProps,
  ImageCropperEmits,
  ImageCropperResult,
  ImageCropperResultOptions,
  _ImageCropperExposed
} from '../../types'
import { UIcon } from '../icon'
import { cropToResult } from './draw-crop'
import { useImageLoader } from './use-image-loader'
import { usePreview } from './use-preview'
import { SELECTION_HANDLES, useSelection } from './use-selection'
import { useTransform } from './use-transform'

defineOptions({ name: 'ImageCropper' })

const props = withDefaults(defineProps<ImageCropperProps>(), {
  showToolbar: true,
  showPreview: true
})

const emit = defineEmits<ImageCropperEmits>()

const cls = bem('image-cropper')

const canvasRef = shallowRef<HTMLElement>()
const selectionRef = shallowRef<HTMLElement>()
const imageRef = shallowRef<HTMLImageElement>()
const previewCanvasRef = shallowRef<HTMLCanvasElement>()

const { imageUrl, loaded, naturalWidth, naturalHeight, imageEl } = useImageLoader({
  src: () => props.src
})

const canvasSize = reactive({ width: 0, height: 0 })

/** 宽高比预设，value 为 undefined 表示自由比例 */
const RATIO_PRESETS: { label: string; value?: number }[] = [
  { label: '自由', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 }
]

/** 当前生效的宽高比：工具栏预设可覆盖 prop，prop 变化时同步回来 */
const currentRatio = shallowRef(props.aspectRatio)

function setAspectRatio(ratio: number | undefined) {
  currentRatio.value = ratio
}

const { transform, fit, reset, resetTransform, zoomIn, zoomOut, rotate, flip, toImageDelta } =
  useTransform({
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
  aspectRatio: () => currentRatio.value
})

usePreview({ canvas: previewCanvasRef, image: imageRef, selection, transform })

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

watch(
  () => props.aspectRatio,
  (ratio) => {
    currentRatio.value = ratio
  }
)

watch(loaded, (isLoaded) => {
  if (!isLoaded) return
  fit()
  initSelection()
})

// 选区或图片变换变化时发出裁剪变化事件，载荷为当前选区（图片像素坐标）与变换摘要
watch([selection, () => ({ ...transform })], () => {
  const sel = selection.value
  if (!sel) return
  emit('crop-change', {
    selection: { ...sel },
    transform: { rotation: transform.rotation, flipX: transform.flipX, flipY: transform.flipY }
  })
})

/** 输出当前选区裁剪结果：默认原图选区像素，options 传入目标宽 / 高时按该尺寸缩放 */
async function getResult(options?: ImageCropperResultOptions): Promise<ImageCropperResult> {
  const img = imageEl.value
  const sel = selection.value
  if (!img || !sel) throw new Error('Export crop result failed: image not loaded or no selection')
  return cropToResult(img, sel, transform, options)
}

defineExpose<_ImageCropperExposed>({ getResult })

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
