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
            <UFileViewerToolbar
              :file="activeFile"
              :index-label="activeIndexLabel"
              :has-prev="hasPrev"
              :has-next="hasNext"
              :zoomable="isZoomable"
              :zoom-percent="zoomPercent"
              :zoom-in-disabled="zoomInDisabled"
              :zoom-out-disabled="zoomOutDisabled"
              :transform-reset="isTransformReset"
              :downloadable="downloadable"
              :modal="isModal"
              @prev="prev"
              @next="next"
              @zoom-in="zoomIn"
              @zoom-out="zoomOut"
              @reset="resetTransform"
              @download="download"
              @close="handleClose"
            />
            <div :class="cls.e('body')">
              <transition name="u-file-viewer-fade" mode="out-in">
                <div v-if="activeFile" :key="activeFile.id" :class="cls.e('viewport')">
                  <component
                    :is="PreviewerMap[activeFile.kind]"
                    ref="previewerRef"
                    :file="activeFile"
                    :resource-url="activeFile.kind === 'pdf' ? pdfResourceUrl : undefined"
                    :max-rows="sheetMaxRows"
                    @error="handleChildError"
                    @zoom-change="handlePreviewerZoomChange"
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
import { bem, withUnit } from '@veltra/utils'
import { computed, defineAsyncComponent, nextTick, ref, useTemplateRef, watch } from 'vue'

import type {
  _FileViewerExposed,
  FileViewerEmits,
  FileViewerKind,
  FileViewerNormalizedItem,
  FileViewerProps
} from '../../types/file-viewer'
import { UEmpty } from '../empty'
import { UScroll } from '../scroll'
import UFileViewerToolbar from './file-viewer-toolbar.vue'
import {
  FILE_VIEWER_KIND_LABEL,
  ZOOM_MAX,
  ZOOM_MIN,
  downloadFile,
  formatBytes,
  inferKind
} from './helper'

// 根为 Teleport，无 fallthrough 落点，关闭 attrs 继承
defineOptions({ name: 'UFileViewer', inheritAttrs: false })

const {
  files,
  sidebarWidth = '280px',
  sheetMaxRows = 50_000,
  downloadable = true,
  closeOnClickBackdrop = true,
  closeOnEsc = true
} = defineProps<FileViewerProps>()

const emit = defineEmits<FileViewerEmits>()

const cls = bem('file-viewer')

/** 工具栏显示缩放控件的类型；缩放一律由 previewer 内部实现，宿主只透传命令并回显级别 */
const ZOOMABLE_KINDS = new Set<FileViewerKind>(['image', 'pdf', 'ofd'])

const activeId = defineModel<string | undefined>('modelValue', { default: undefined })
const openModel = defineModel<boolean | undefined>('open', { default: undefined })

const rootRef = useTemplateRef<HTMLDivElement>('rootRef')
const previewerRef = useTemplateRef<{
  zoomIn?: () => void
  zoomOut?: () => void
  resetZoom?: () => void
}>('previewerRef')
/** 预览器上报的缩放级别，驱动工具栏回显与禁用态 */
const previewerZoomLevel = ref(1)

const PreviewerMap: Record<FileViewerKind, ReturnType<typeof defineAsyncComponent>> = {
  image: defineAsyncComponent(() => import('./previewers/image-previewer.vue')),
  video: defineAsyncComponent(() => import('./previewers/video-previewer.vue')),
  pdf: defineAsyncComponent(() => import('./previewers/pdf-previewer.vue')),
  sheet: defineAsyncComponent(() => import('./previewers/sheet-previewer.vue')),
  docx: defineAsyncComponent(() => import('./previewers/docx-previewer.vue')),
  ofd: defineAsyncComponent(() => import('./previewers/ofd-previewer.vue')),
  text: defineAsyncComponent(() => import('./previewers/text-previewer.vue'))
}

const normalizedFiles = computed<FileViewerNormalizedItem[]>(() =>
  files.map((f, i) => ({ ...f, id: f.id ?? `file-${i}`, kind: inferKind(f.name, f.kind) }))
)

const activeFile = computed<FileViewerNormalizedItem | undefined>(() =>
  normalizedFiles.value.find((f) => f.id === activeId.value)
)

const activeIndex = computed(() => normalizedFiles.value.findIndex((f) => f.id === activeId.value))

const hasPrev = computed(() => activeIndex.value > 0)
const hasNext = computed(
  () => activeIndex.value >= 0 && activeIndex.value < normalizedFiles.value.length - 1
)

const showSidebar = computed(() => sidebarWidth !== false && sidebarWidth !== 0)

const sidebarWidthCss = computed(() => {
  if (sidebarWidth === false || sidebarWidth === 0) return undefined
  return withUnit(sidebarWidth ?? '280px', 'px')
})

/** 是否启用模态模式：只要父组件显式传入 open（含 v-model:open），即进入模态 */
const isModal = computed(() => openModel.value !== undefined)

const activeIndexLabel = computed(() =>
  activeIndex.value >= 0 ? `${activeIndex.value + 1} / ${normalizedFiles.value.length}` : ''
)

const isZoomable = computed(() => !!activeFile.value && ZOOMABLE_KINDS.has(activeFile.value.kind))

const zoomPercent = computed(() => `${Math.round(previewerZoomLevel.value * 100)}%`)

const zoomInDisabled = computed(() => !isZoomable.value || previewerZoomLevel.value >= ZOOM_MAX)

const zoomOutDisabled = computed(() => !isZoomable.value || previewerZoomLevel.value <= ZOOM_MIN)

const isTransformReset = computed(() => Math.abs(previewerZoomLevel.value - 1) < 0.02)

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

function zoomIn() {
  previewerRef.value?.zoomIn?.()
}

function zoomOut() {
  previewerRef.value?.zoomOut?.()
}

function resetTransform() {
  // 重置后的回显交给预览器同步 emit 的 zoom-change（image 回 100%，pdf 回 fit-page，ofd 回 100%）
  previewerRef.value?.resetZoom?.()
}

function handlePreviewerZoomChange(level: number) {
  previewerZoomLevel.value = level
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
  if (closeOnEsc === false) return
  e.stopPropagation()
  handleClose()
}

function handleBackdropMousedown() {
  if (!isModal.value) return
  if (closeOnClickBackdrop === false) return
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

// 切文件时 out-in 模式下新预览器全新挂载并自行回初始级别，这里同步回显即可
watch(
  () => activeFile.value?.id,
  () => {
    previewerZoomLevel.value = 1
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
  ([modal, open], _, onCleanup) => {
    // 依赖重跑前与作用域销毁时统一解锁 + 摘除 keydown 监听
    onCleanup(() => {
      unlockBody()
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleWindowKeydown, true)
      }
    })
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
    }
  },
  { immediate: true }
)

defineExpose<_FileViewerExposed>({ activeId, activate, next, prev })
</script>
