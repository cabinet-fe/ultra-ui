<template>
  <div>
    <CustomCard title="图片预览 Lightbox">
      <div class="controls">
        <u-button type="primary" @click="openBuiltIn">打开预览</u-button>
        <u-file-picker accept="image/*" @pick="onPick">
          <u-button>选择本地图片</u-button>
        </u-file-picker>
        <u-button @click="openBroken">加载失败示例</u-button>
        <u-checkbox v-model="escClose">Esc 关闭</u-checkbox>
        <u-checkbox v-model="backdropClose">点击遮罩关闭</u-checkbox>
      </div>
      <p class="hint">
        Ctrl / ⌘ + 滚轮与底部工具按钮缩放，双击在 100% / 200% 间切换；放大后可拖拽平移；
        Esc、点击图片外区域或右上角按钮关闭
      </p>
      <p class="hint">{{ lastEvent }}</p>
    </CustomCard>

    <u-image-previewer
      v-model:open="open"
      :src="activeSrc"
      alt="示例图片"
      :close-on-esc="escClose"
      :close-on-click-backdrop="backdropClose"
      @close="lastEvent = 'close'"
      @zoom-change="onZoomChange"
      @error="lastEvent = 'error：图片加载失败'"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

/** 内置示例图：画布生成 dataURL，避免外部图片的网络与跨域依赖 */
function createSampleImage(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 800
  const ctx = canvas.getContext('2d')!

  const sky = ctx.createLinearGradient(0, 0, 0, 800)
  sky.addColorStop(0, '#0f172a')
  sky.addColorStop(1, '#38bdf8')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 1280, 800)

  ctx.fillStyle = '#fde68a'
  ctx.beginPath()
  ctx.arc(1040, 170, 74, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.moveTo(0, 800)
  ctx.lineTo(320, 330)
  ctx.lineTo(680, 800)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.moveTo(500, 800)
  ctx.lineTo(860, 280)
  ctx.lineTo(1280, 800)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#f8fafc'
  ctx.font = 'bold 64px sans-serif'
  ctx.fillText('Ultra UI Image Previewer', 64, 140)

  return canvas.toDataURL('image/png')
}

const sampleSrc = createSampleImage()

const open = ref(false)
const activeSrc = shallowRef<string | File>(sampleSrc)
const escClose = ref(true)
const backdropClose = ref(true)
const lastEvent = ref('尚未触发事件')

function openBuiltIn() {
  activeSrc.value = sampleSrc
  open.value = true
}

function onPick(files: File[]) {
  const file = files[0]
  if (!file) return
  activeSrc.value = file
  open.value = true
}

function openBroken() {
  activeSrc.value = 'https://example.com/broken.png'
  open.value = true
}

function onZoomChange(level: number) {
  lastEvent.value = `zoom-change：${Math.round(level * 100)}%`
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

.hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
