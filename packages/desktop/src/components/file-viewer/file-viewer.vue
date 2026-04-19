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
                @click="activate(f.id)"
              >
                <span :class="[cls.e('badge'), cls.em('badge', f.kind)]">
                  {{ label(f.kind) }}
                </span>
                <span :class="cls.e('item-meta')">
                  <span :class="cls.e('item-name')" :title="f.name">{{ f.name }}</span>
                  <span :class="cls.e('item-size')">{{ formatBytes(f.size) }}</span>
                </span>
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
                <span :class="cls.e('stage-name')">
                  {{ activeFile?.name ?? '—' }}
                </span>
                <span v-if="activeFile?.size" :class="cls.e('stage-sub')">
                  {{ formatBytes(activeFile.size) }}
                </span>
              </div>
              <div :class="cls.e('stage-actions')">
                <button :class="cls.e('action')" :disabled="!hasPrev" type="button" @click="prev">
                  上一个
                </button>
                <button :class="cls.e('action')" :disabled="!hasNext" type="button" @click="next">
                  下一个
                </button>
                <button
                  v-if="downloadable && activeFile"
                  :class="[cls.e('action'), cls.em('action', 'primary')]"
                  type="button"
                  @click="download"
                >
                  下载
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
                <component
                  :is="PreviewerMap[activeFile.kind]"
                  v-if="activeFile"
                  :key="activeFile.id"
                  :file="activeFile"
                  :max-rows="sheetMaxRows"
                  @error="handleChildError"
                />
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
import { Close } from '@veltra/icons/normal'
import { bem, withUnit } from '@veltra/utils'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, shallowRef, watch } from 'vue'

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

const activeId = defineModel<string | undefined>('modelValue', { default: undefined })
const openModel = defineModel<boolean | undefined>('open', { default: undefined })

const rootRef = shallowRef<HTMLDivElement>()

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
