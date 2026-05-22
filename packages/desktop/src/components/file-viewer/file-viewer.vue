<template>
  <Teleport to="body" :disabled="!isModal">
    <transition :name="isModal ? 'u-file-viewer-modal' : ''">
      <div
        v-if="!isModal || openModel"
        :class="[cls.b, bem.is('modal', isModal)]"
        :tabindex="isModal ? -1 : undefined"
        ref="rootRef"
        @mousedown.self="handleBackdropMousedown"
      >
        <div v-if="isModal" :class="cls.e('backdrop')" @mousedown.self="handleBackdropMousedown" />
        <div :class="cls.e('inner')">
          <aside v-if="showSidebar" :class="cls.e('sidebar')" :style="{ width: sidebarWidthCss }">
            <header :class="cls.e('sidebar-head')">
              <span :class="cls.e('sidebar-title')">文件</span>
              <span :class="cls.e('sidebar-count')">{{ normalizedFiles.length }}</span>
            </header>
            <u-scroll tag="ul" :class="cls.e('list')">
              <li
                v-for="f in normalizedFiles"
                :key="f.id"
                :class="[cls.e('item'), bem.is('active', f.id === activeId)]"
                :title="f.name"
                @click="activate(f.id)"
              >
                <span :class="cls.e('item-meta')">
                  <span :class="cls.e('item-name')" :title="f.name">{{ f.name }}</span>
                  <span :class="cls.e('item-size')">{{ formatBytes(f.size) }}</span>
                </span>
                <span :class="cls.e('item-kind')">{{ label(f.kind) }}</span>
              </li>
              <li v-if="!normalizedFiles.length" :class="cls.e('list-empty')">
                <u-empty text="暂无文件" :size="32" />
              </li>
            </u-scroll>
          </aside>

          <section :class="cls.e('stage')">
            <header :class="cls.e('stage-head')">
              <div :class="cls.e('stage-title')">
                <span v-if="activeFile" :class="[cls.e('badge'), cls.em('badge', activeFile.kind)]">
                  {{ label(activeFile.kind) }}
                </span>
                <span :class="cls.e('stage-copy')">
                  <span :class="cls.e('stage-name')" :title="activeFile?.name">
                    {{ activeFile?.name ?? '—' }}
                  </span>
                  <span v-if="activeFile" :class="cls.e('stage-sub')">
                    <span>{{ activeIndexLabel }}</span>
                    <span v-if="activeFile.size">{{ formatBytes(activeFile.size) }}</span>
                  </span>
                </span>
              </div>
              <div :class="cls.e('stage-actions')">
                <span :class="cls.e('action-group')">
                  <button
                    :class="[cls.e('action'), cls.em('action', 'icon')]"
                    :disabled="!hasPrev"
                    type="button"
                    aria-label="上一个"
                    title="上一个"
                    @click="prev"
                  >
                    <u-icon :size="15">
                      <ArrowLeft />
                    </u-icon>
                  </button>
                  <button
                    :class="[cls.e('action'), cls.em('action', 'icon')]"
                    :disabled="!hasNext"
                    type="button"
                    aria-label="下一个"
                    title="下一个"
                    @click="next"
                  >
                    <u-icon :size="15">
                      <ArrowRight />
                    </u-icon>
                  </button>
                </span>
                <span v-if="isZoomable" :class="cls.e('action-group')">
                  <button
                    :class="[cls.e('action'), cls.em('action', 'icon')]"
                    :disabled="zoomOutDisabled"
                    type="button"
                    aria-label="缩小"
                    title="缩小"
                    @click="zoomOut"
                  >
                    <u-icon :size="15">
                      <ZoomOut />
                    </u-icon>
                  </button>
                  <span :class="cls.e('zoom-value')">{{ zoomPercent }}</span>
                  <button
                    :class="[cls.e('action'), cls.em('action', 'icon')]"
                    :disabled="zoomInDisabled"
                    type="button"
                    aria-label="放大"
                    title="放大"
                    @click="zoomIn"
                  >
                    <u-icon :size="15">
                      <ZoomIn />
                    </u-icon>
                  </button>
                  <button
                    :class="[cls.e('action'), cls.em('action', 'icon')]"
                    :disabled="isTransformReset"
                    type="button"
                    aria-label="重置视图"
                    title="重置视图"
                    @click="resetTransform"
                  >
                    <u-icon :size="15">
                      <Refresh />
                    </u-icon>
                  </button>
                </span>
                <button
                  v-if="downloadable && activeFile"
                  :class="[cls.e('action'), cls.em('action', 'primary'), cls.em('action', 'icon')]"
                  type="button"
                  aria-label="下载"
                  title="下载"
                  @click="download"
                >
                  <u-icon :size="15">
                    <Download />
                  </u-icon>
                </button>
                <button
                  v-if="isModal"
                  :class="[cls.e('action'), cls.em('action', 'icon')]"
                  type="button"
                  aria-label="关闭预览"
                  title="关闭"
                  @click="handleClose"
                >
                  <u-icon :size="16">
                    <Close />
                  </u-icon>
                </button>
              </div>
            </header>
            <div :class="cls.e('body')">
              <transition name="u-file-viewer-fade" mode="out-in">
                <div
                  v-if="activeFile"
                  :key="activeFile.id"
                  :class="[
                    cls.e('viewport'),
                    bem.is('transformable', isTransformable),
                    bem.is('pannable', canPan),
                    bem.is('dragging', isDragging)
                  ]"
                  @pointerdown.capture="handleViewportPointerDown"
                  @pointermove.capture="handleViewportPointerMove"
                  @pointerup.capture="handleViewportPointerEnd"
                  @pointercancel.capture="handleViewportPointerEnd"
                  @wheel="handleViewportWheel"
                  @dblclick="handleViewportDblclick"
                >
                  <component
                    :is="PreviewerMap[activeFile.kind]"
                    ref="previewerRef"
                    :file="activeFile"
                    :max-rows="sheetMaxRows"
                    :class="isTransformable ? cls.e('previewer') : undefined"
                    :style="previewerStyle"
                    @error="handleChildError"
                    @zoom-change="handlePdfZoomChange"
                  />
                </div>
                <div v-else :class="cls.e('empty')">
                  <u-empty text="暂无可预览文件" />
                </div>
              </transition>
            </div>
          </section>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import {
  ArrowLeft,
  ArrowRight,
  Close,
  Download,
  Refresh,
  ZoomIn,
  ZoomOut
} from '@veltra/icons/normal'
import { bem, withUnit } from '@veltra/utils'
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch
} from 'vue'
import type { CSSProperties } from 'vue'

import type {
  _FileViewerExposed,
  FileViewerEmits,
  FileViewerItem,
  FileViewerKind,
  FileViewerProps
} from '../../types/file-viewer'
import { UEmpty } from '../empty'
import { UIcon } from '../icon'
import { UScroll } from '../scroll'
import { FILE_VIEWER_KIND_LABEL, downloadFile, formatBytes, inferKind } from './helper'

defineOptions({
  name: 'FileViewer',
  inheritAttrs: false
})

const props = withDefaults(defineProps<FileViewerProps>(), {
  modelValue: undefined,
  sidebarWidth: '280px',
  sheetMaxRows: 50_000,
  downloadable: true,
  open: undefined,
  closeOnClickBackdrop: true,
  closeOnEsc: true
})

const emit = defineEmits<FileViewerEmits>()

const cls = bem('file-viewer')

const MIN_SCALE = 0.5
const MAX_SCALE = 3
/** 每次缩放固定增减 10% */
const SCALE_STEP = 0.1
/** 使用 CSS transform 缩放的类型（PDF 由 EmbedPDF zoom 插件处理） */
const TRANSFORMABLE_KINDS = new Set<FileViewerKind>(['image'])
/** 工具栏显示缩放控件的类型 */
const ZOOMABLE_KINDS = new Set<FileViewerKind>(['image', 'pdf'])

const activeId = defineModel<string | undefined>('modelValue', { default: undefined })
const openModel = defineModel<boolean | undefined>('open', { default: undefined })

const rootRef = shallowRef<HTMLDivElement>()
const previewerRef = shallowRef<{
  zoomIn?: () => void
  zoomOut?: () => void
  resetZoom?: () => void
}>()
const scale = ref(1)
const pdfZoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const isDragging = ref(false)

let dragState:
  | {
      pointerId: number
      startX: number
      startY: number
      originX: number
      originY: number
    }
  | undefined

const PreviewerMap: Record<FileViewerKind, ReturnType<typeof defineAsyncComponent>> = {
  image: defineAsyncComponent(() => import('./previewers/image-previewer.vue')),
  video: defineAsyncComponent(() => import('./previewers/video-previewer.vue')),
  pdf: defineAsyncComponent(() => import('./previewers/pdf-previewer.vue')),
  sheet: defineAsyncComponent(() => import('./previewers/sheet-previewer.vue')),
  docx: defineAsyncComponent(() => import('./previewers/docx-previewer.vue')),
  text: defineAsyncComponent(() => import('./previewers/text-previewer.vue'))
}

interface NormalizedFile extends FileViewerItem {
  id: string
  kind: FileViewerKind
}

const normalizedFiles = computed<NormalizedFile[]>(() =>
  props.files.map((f, i) => ({
    ...f,
    id: f.id ?? `file-${i}`,
    kind: inferKind(f.name, f.kind)
  }))
)

const activeFile = computed<NormalizedFile | undefined>(() =>
  normalizedFiles.value.find((f) => f.id === activeId.value)
)

const activeIndex = computed(() => normalizedFiles.value.findIndex((f) => f.id === activeId.value))

const hasPrev = computed(() => activeIndex.value > 0)
const hasNext = computed(
  () => activeIndex.value >= 0 && activeIndex.value < normalizedFiles.value.length - 1
)

const showSidebar = computed(() => props.sidebarWidth !== false && props.sidebarWidth !== 0)

const sidebarWidthCss = computed(() => {
  const w = props.sidebarWidth
  if (w === false || w === 0) return undefined
  return withUnit(w ?? '280px', 'px')
})

/** 是否启用模态模式：只要父组件显式传入 open（含 v-model:open），即进入模态 */
const isModal = computed(() => openModel.value !== undefined)

const activeIndexLabel = computed(() =>
  activeIndex.value >= 0 ? `${activeIndex.value + 1} / ${normalizedFiles.value.length}` : ''
)

const isTransformable = computed(
  () => !!activeFile.value && TRANSFORMABLE_KINDS.has(activeFile.value.kind)
)

const isZoomable = computed(() => !!activeFile.value && ZOOMABLE_KINDS.has(activeFile.value.kind))

const isPdfActive = computed(() => activeFile.value?.kind === 'pdf')

const canPan = computed(() => isTransformable.value && scale.value > 1)

const displayZoomLevel = computed(() => (isPdfActive.value ? pdfZoomLevel.value : scale.value))

const zoomPercent = computed(() => `${Math.round(displayZoomLevel.value * 100)}%`)

const zoomInDisabled = computed(() => !isZoomable.value || displayZoomLevel.value >= MAX_SCALE)

const zoomOutDisabled = computed(() => !isZoomable.value || displayZoomLevel.value <= MIN_SCALE)

const isTransformReset = computed(() => {
  if (isPdfActive.value) {
    return Math.abs(pdfZoomLevel.value - 1) < 0.02
  }
  return scale.value === 1 && offsetX.value === 0 && offsetY.value === 0
})

const previewerStyle = computed<CSSProperties | undefined>(() => {
  if (!isTransformable.value) return undefined
  return {
    transform: `translate3d(${offsetX.value}px, ${offsetY.value}px, 0) scale(${scale.value})`
  }
})

function label(kind: FileViewerKind): string {
  return FILE_VIEWER_KIND_LABEL[kind]
}

function activate(id: string) {
  if (activeId.value === id) return
  activeId.value = id
  const f = normalizedFiles.value.find((x) => x.id === id)
  if (f) emit('change', f)
}

function prev() {
  const i = activeIndex.value
  if (i <= 0) return
  const target = normalizedFiles.value[i - 1]
  if (target) activate(target.id)
}

function next() {
  const i = activeIndex.value
  if (i < 0 || i >= normalizedFiles.value.length - 1) return
  const target = normalizedFiles.value[i + 1]
  if (target) activate(target.id)
}

function normalizeScale(value: number): number {
  const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
  return Math.round(clamped * 100) / 100
}

function setScale(value: number) {
  scale.value = normalizeScale(value)
  if (scale.value <= 1) {
    offsetX.value = 0
    offsetY.value = 0
  }
}

function zoomIn() {
  if (!isZoomable.value) return
  if (isPdfActive.value) {
    previewerRef.value?.zoomIn?.()
    return
  }
  setScale(scale.value + SCALE_STEP)
}

function zoomOut() {
  if (!isZoomable.value) return
  if (isPdfActive.value) {
    previewerRef.value?.zoomOut?.()
    return
  }
  setScale(scale.value - SCALE_STEP)
}

function resetTransform() {
  if (isPdfActive.value) {
    previewerRef.value?.resetZoom?.()
    pdfZoomLevel.value = 1
    return
  }
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  dragState = undefined
  isDragging.value = false
}

function handlePdfZoomChange(level: number) {
  pdfZoomLevel.value = level
}

function isZoomWheel(e: WheelEvent): boolean {
  return e.ctrlKey || e.metaKey
}

function handleViewportWheel(e: WheelEvent) {
  if (!activeFile.value || activeFile.value.kind !== 'image') return
  if (!isZoomWheel(e)) return
  if (isInteractiveTarget(e.target)) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP
  setScale(scale.value + delta)
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return !!target.closest('button, a, input, textarea, select, video, [contenteditable="true"]')
}

function handleViewportPointerDown(e: PointerEvent) {
  if (!canPan.value || e.button !== 0 || isInteractiveTarget(e.target)) return

  dragState = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    originX: offsetX.value,
    originY: offsetY.value
  }
  isDragging.value = true
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  e.preventDefault()
}

function handleViewportPointerMove(e: PointerEvent) {
  if (!dragState || dragState.pointerId !== e.pointerId) return
  offsetX.value = dragState.originX + e.clientX - dragState.startX
  offsetY.value = dragState.originY + e.clientY - dragState.startY
}

function handleViewportPointerEnd(e: PointerEvent) {
  if (!dragState || dragState.pointerId !== e.pointerId) return
  const el = e.currentTarget as HTMLElement
  if (el.hasPointerCapture(e.pointerId)) {
    el.releasePointerCapture(e.pointerId)
  }
  dragState = undefined
  isDragging.value = false
}

function handleViewportDblclick() {
  if (isPdfActive.value) return
  if (!isTransformable.value) return
  if (scale.value === 1) {
    setScale(2)
  } else {
    resetTransform()
  }
}

async function download() {
  if (!activeFile.value) return
  try {
    await downloadFile(activeFile.value)
  } catch (err) {
    emit('error', { file: activeFile.value, error: err })
  }
}

function handleChildError(err: unknown) {
  if (!activeFile.value) return
  emit('error', { file: activeFile.value, error: err })
}

function handleClose() {
  if (!isModal.value) return
  openModel.value = false
}

function handleWindowKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (!isModal.value || !openModel.value) return
  if (props.closeOnEsc === false) return
  e.stopPropagation()
  handleClose()
}

function handleBackdropMousedown() {
  if (!isModal.value) return
  if (props.closeOnClickBackdrop === false) return
  handleClose()
}

watch(
  normalizedFiles,
  (files) => {
    if (!files.length) {
      activeId.value = undefined
      return
    }
    if (!activeId.value || !files.some((f) => f.id === activeId.value)) {
      activeId.value = files[0]!.id
    }
  },
  { immediate: true }
)

watch(
  () => activeFile.value?.id,
  async () => {
    pdfZoomLevel.value = 1
    await nextTick()
    resetTransform()
  }
)

// 模态打开时：锁定 body 滚动 + 让容器获得焦点以便接收 ESC
let previousBodyOverflow = ''
let isBodyLocked = false

function lockBody() {
  if (isBodyLocked || typeof document === 'undefined') return
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  isBodyLocked = true
}

function unlockBody() {
  if (!isBodyLocked || typeof document === 'undefined') return
  document.body.style.overflow = previousBodyOverflow
  isBodyLocked = false
}

watch(
  [isModal, openModel],
  ([modal, open]) => {
    if (modal && open) {
      lockBody()
      nextTick(() => {
        rootRef.value?.focus()
      })
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleWindowKeydown, true)
      }
    } else {
      unlockBody()
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleWindowKeydown, true)
      }
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  unlockBody()
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleWindowKeydown, true)
  }
})

defineExpose<_FileViewerExposed>({
  activeId,
  activate,
  next,
  prev
})
</script>
