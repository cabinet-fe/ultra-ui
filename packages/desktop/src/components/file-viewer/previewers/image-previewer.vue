<template>
  <div
    ref="root"
    :class="[cls.e('image'), bem.is('pannable', scale > 1), bem.is('dragging', isDragging)]"
    v-bind="attrs"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerEnd"
    @wheel="onWheel"
    @dblclick="onDblclick"
  >
    <img
      v-if="url"
      :src="url"
      :alt="file.name"
      draggable="false"
      @dragstart.prevent
      @load="loading = false"
      @error="onImgError"
    />
    <div v-if="loading" :class="cls.e('loading')">加载中…</div>
    <div v-if="failed" :class="cls.e('loading')">图片加载失败</div>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { onBeforeUnmount, ref, shallowRef, useAttrs, useTemplateRef, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'
import { ZOOM_STEP, clampZoom, toBlobUrl } from '../helper'

defineOptions({ name: 'UFileViewerImagePreviewer', inheritAttrs: false })

const props = defineProps<{ file: FileViewerItem }>()

const emit = defineEmits<{
  (e: 'error', err: unknown): void
  (e: 'zoom-change', level: number): void
}>()

const cls = bem('file-viewer')
const attrs = useAttrs()

const root = useTemplateRef<HTMLDivElement>('root')

const url = shallowRef<string>('')
const loading = ref(true)
const failed = ref(false)

/** 缩放级别；缩放入口统一经 setScale 收敛到 [ZOOM_MIN, ZOOM_MAX] */
const scale = ref(1)
/** 拖拽起止各写一次，仅驱动 grabbing 光标 */
const isDragging = ref(false)

// ---- pan 热状态：全部走普通变量，pointermove 不触发重渲染 ----
let panState:
  | { pointerId: number; startX: number; startY: number; originX: number; originY: number }
  | undefined
let offsetX = 0
let offsetY = 0

/** transform 唯一写入口：直接写根元素 style，绕开响应式 */
function applyTransform() {
  const el = root.value
  if (!el) return
  el.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale.value})`
}

function setScale(value: number) {
  scale.value = clampZoom(value)
  if (scale.value <= 1) {
    // 未放大时不允许平移，offset 归零
    offsetX = 0
    offsetY = 0
  }
  applyTransform()
  emit('zoom-change', scale.value)
}

function zoomIn() {
  setScale(scale.value + ZOOM_STEP)
}

function zoomOut() {
  setScale(scale.value - ZOOM_STEP)
}

function resetZoom() {
  setScale(1)
}

defineExpose({ zoomIn, zoomOut, resetZoom })

function onPointerDown(e: PointerEvent) {
  if (scale.value <= 1 || e.button !== 0) return
  panState = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    originX: offsetX,
    originY: offsetY
  }
  isDragging.value = true
  root.value?.setPointerCapture(e.pointerId)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  if (!panState || panState.pointerId !== e.pointerId) return
  offsetX = panState.originX + e.clientX - panState.startX
  offsetY = panState.originY + e.clientY - panState.startY
  applyTransform()
}

function onPointerEnd(e: PointerEvent) {
  if (!panState || panState.pointerId !== e.pointerId) return
  const el = root.value
  if (el?.hasPointerCapture(e.pointerId)) {
    el.releasePointerCapture(e.pointerId)
  }
  panState = undefined
  isDragging.value = false
}

function onWheel(e: WheelEvent) {
  if (!(e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  setScale(scale.value + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP))
}

function onDblclick() {
  if (scale.value === 1) {
    setScale(2)
  } else {
    resetZoom()
  }
}

let revoke: (() => void) | undefined

function load() {
  loading.value = true
  failed.value = false
  revoke?.()
  const r = toBlobUrl(props.file.src, props.file.mime)
  url.value = r.url
  revoke = r.revoke
  // 新文件回到初始视图，并同步工具栏回显
  setScale(1)
}

function onImgError(e: Event) {
  loading.value = false
  failed.value = true
  emit('error', e)
}

watch(
  () => props.file.src,
  () => load(),
  { immediate: true }
)

onBeforeUnmount(() => {
  revoke?.()
  url.value = ''
})
</script>
