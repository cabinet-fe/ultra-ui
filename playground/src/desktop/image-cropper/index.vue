<template>
  <div>
    <CustomCard title="图片裁剪">
      <div class="controls">
        <u-segment :items="sourceItems" v-model="sourceType" />
        <u-file-picker v-if="sourceType === 'file'" accept="image/*" @pick="onPick">
          <u-button>选择图片</u-button>
        </u-file-picker>
        <u-segment :items="ratioItems" v-model="ratio" />
        <u-checkbox v-model="showToolbar">工具栏</u-checkbox>
        <u-checkbox v-model="showPreview">预览</u-checkbox>
      </div>

      <u-image-cropper
        ref="cropper"
        class="cropper"
        :src="sourceType === 'file' ? fileSrc : sampleUrl"
        :aspect-ratio="ratio || undefined"
        :show-toolbar="showToolbar"
        :show-preview="showPreview"
        @crop-change="onCropChange"
      />
      <p class="hint">{{ changeText || '拖动选区调整范围，滚轮缩放图片，工具栏旋转 / 翻转' }}</p>
    </CustomCard>

    <CustomCard title="裁剪结果">
      <u-button type="primary" @click="exportResult">获取裁剪结果</u-button>
      <template v-if="result">
        <img class="result-image" :src="result.base64" alt="裁剪结果" />
        <p class="hint">image/png · {{ (result.blob.size / 1024).toFixed(1) }} KB</p>
      </template>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { message } from '@veltra/desktop'
import type {
  ImageCropperChangePayload,
  ImageCropperExposed,
  ImageCropperResult
} from '@veltra/desktop'
import { ref, shallowRef, useTemplateRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

/** 内置示例图：画布生成 dataURL，避免外部图片的网络与跨域依赖 */
function createSampleImage(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 960
  canvas.height = 600
  const ctx = canvas.getContext('2d')!

  const sky = ctx.createLinearGradient(0, 0, 0, 600)
  sky.addColorStop(0, '#7db9e8')
  sky.addColorStop(1, '#e8f3ff')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 960, 600)

  ctx.fillStyle = '#ffd666'
  ctx.beginPath()
  ctx.arc(760, 130, 70, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#5b8c5a'
  ctx.beginPath()
  ctx.moveTo(0, 600)
  ctx.lineTo(260, 260)
  ctx.lineTo(520, 600)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#40704a'
  ctx.beginPath()
  ctx.moveTo(380, 600)
  ctx.lineTo(660, 220)
  ctx.lineTo(960, 600)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#8fbc6f'
  ctx.fillRect(0, 520, 960, 80)

  ctx.fillStyle = '#1f2d3d'
  ctx.font = 'bold 48px sans-serif'
  ctx.fillText('Ultra UI', 60, 110)

  return canvas.toDataURL('image/png')
}

const sampleUrl = createSampleImage()

const sourceItems = [
  { label: '内置图片', value: 'url' },
  { label: '本地文件', value: 'file' }
]
const sourceType = ref('url')
const fileSrc = shallowRef<File>()

function onPick(files: File[]) {
  fileSrc.value = files[0]
}

const ratioItems = [
  { label: '自由', value: 0 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 }
]
const ratio = ref(0)

const showToolbar = ref(true)
const showPreview = ref(true)

const changeText = shallowRef('')

function onCropChange(payload: ImageCropperChangePayload) {
  const { x, y, width, height } = payload.selection
  const { rotation, flipX, flipY } = payload.transform
  const flips = [flipX && '水平翻转', flipY && '垂直翻转'].filter(Boolean).join(' / ')
  changeText.value =
    `选区 ${Math.round(width)}×${Math.round(height)} @ (${Math.round(x)}, ${Math.round(y)})` +
    (rotation ? ` · 旋转 ${rotation}°` : '') +
    (flips ? ` · ${flips}` : '')
}

const cropperRef = useTemplateRef<ImageCropperExposed>('cropper')
const result = shallowRef<ImageCropperResult>()

async function exportResult() {
  const cropper = cropperRef.value
  if (!cropper) return
  try {
    result.value = await cropper.getResult()
  } catch {
    message({ type: 'warn', message: '图片未加载，无法输出裁剪结果' })
  }
}
</script>

<style scoped lang="scss">
.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.cropper {
  height: 480px;
  border: 1px solid var(--u-border-color);
  border-radius: 6px;
}

.hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.result-image {
  display: block;
  max-width: 360px;
  margin-top: 16px;
  border: 1px solid var(--u-border-color);
  border-radius: 6px;
}
</style>
