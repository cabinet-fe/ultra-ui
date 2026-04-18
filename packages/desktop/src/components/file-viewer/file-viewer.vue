<template>
  <div :class="cls.b">
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
          <span :class="[cls.e('badge'), cls.em('badge', f.kind)]">{{ label(f.kind) }}</span>
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
</template>

<script lang="ts" setup>
import { bem, withUnit } from '@veltra/utils'
import { computed, defineAsyncComponent, watch } from 'vue'

import type {
  _FileViewerExposed,
  FileViewerEmits,
  FileViewerItem,
  FileViewerKind,
  FileViewerProps
} from '../../types/file-viewer'
import { UEmpty } from '../empty'
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
  downloadable: true
})

const emit = defineEmits<FileViewerEmits>()

const cls = bem('file-viewer')

const activeId = defineModel<string | undefined>('modelValue', { default: undefined })

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

defineExpose<_FileViewerExposed>({
  activeId,
  activate,
  next,
  prev
})
</script>
