<template>
  <div class="fv-demo">
    <header class="fv-demo__head">
      <div class="fv-demo__copy">
        <p class="fv-demo__eyebrow">UFileViewer</p>
        <h2 class="fv-demo__title">一个面板，预览所有常用格式</h2>
        <p class="fv-demo__lede">
          图片 / 视频 / PDF / XLSX / CSV / DOCX / TXT
          都在这里。点击「打开预览」以全屏模态方式查看，支持 ESC 或点击背景关闭。
        </p>
      </div>
      <div class="fv-demo__actions">
        <u-button type="primary" @click="previewOpen = true">打开预览</u-button>
        <u-file-picker multiple @pick="onPick">
          <u-button>加入预览</u-button>
        </u-file-picker>
        <u-button v-if="localCount > 0" @click="clearLocal">清空本地文件</u-button>
      </div>
    </header>

    <section class="fv-demo__files">
      <header class="fv-demo__files-head">
        <h4>当前待预览文件</h4>
        <span class="fv-demo__files-count">{{ files.length }} 个</span>
      </header>
      <ul class="fv-demo__files-list">
        <li
          v-for="f in files"
          :key="f.id"
          class="fv-demo__file"
          :class="{ 'fv-demo__file--active': f.id === active }"
          @click="openAt(f.id)"
        >
          <span class="fv-demo__chip">{{ resolveKind(f).toUpperCase() }}</span>
          <span class="fv-demo__file-name">{{ f.name }}</span>
          <span class="fv-demo__file-meta">{{ resolveMeta(f) }}</span>
        </li>
      </ul>
    </section>

    <u-file-viewer v-model="active" v-model:open="previewOpen" :files="files" @error="onError" />
  </div>
</template>

<script lang="ts" setup>
import type { FileViewerItem, FileViewerKind } from '@veltra/desktop'
import { computed, ref, shallowRef } from 'vue'

const sampleTxt =
  'data:text/plain;charset=utf-8,' +
  encodeURIComponent(
    [
      'Ultra UI · File Viewer',
      '======================',
      '',
      '一个面板预览多种格式的文件：',
      '  - 图片 (<img>)',
      '  - 视频 (<video>)',
      '  - PDF  (EmbedPDF)',
      '  - 表格 (@veltra/sheet-core 只读预览)',
      '  - Word (docx-preview)',
      '  - 纯文本',
      '',
      '切换文件时，上一个预览器实例会被即时销毁，Blob ObjectURL 立即回收。',
      '这样即便在长时间的运营场景下也不会泄漏内存。'
    ].join('\n')
  )

const sampleCsv =
  'data:text/csv;charset=utf-8,' +
  encodeURIComponent(
    [
      'Region,Quarter,Revenue,Orders,Margin',
      'North,Q1,128340,412,0.28',
      'North,Q2,145902,489,0.31',
      'South,Q1,98450,338,0.22',
      'South,Q2,110284,402,0.25',
      'East,Q1,76230,211,0.19',
      'East,Q2,82913,244,0.21',
      'West,Q1,169420,521,0.33',
      'West,Q2,183650,598,0.35'
    ].join('\n')
  )

const sampleFiles: FileViewerItem[] = [
  {
    id: 'sample-image',
    name: 'mountains.jpg',
    src: 'https://picsum.photos/id/1018/1600/900',
    kind: 'image'
  },
  {
    id: 'sample-video',
    name: 'ForBiggerBlazes.mp4',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    kind: 'video',
    mime: 'video/mp4'
  },
  {
    id: 'sample-pdf',
    name: 'ebook.pdf',
    src: 'https://snippet.embedpdf.com/ebook.pdf',
    kind: 'pdf'
  },
  { id: 'sample-csv', name: 'sales-summary.csv', src: sampleCsv, kind: 'sheet' },
  { id: 'sample-txt', name: 'readme.txt', src: sampleTxt, kind: 'text' }
]

const localFiles = shallowRef<FileViewerItem[]>([])
const active = ref<string | undefined>(sampleFiles[0]?.id)
const previewOpen = ref(false)

const files = computed<FileViewerItem[]>(() => [...sampleFiles, ...localFiles.value])

const localCount = computed(() => localFiles.value.length)

function onPick(picked: File[]) {
  if (!picked.length) return
  const next: FileViewerItem[] = picked.map((f, i) => ({
    id: `local-${Date.now()}-${i}`,
    name: f.name,
    src: f,
    size: f.size,
    mime: f.type
  }))
  localFiles.value = [...localFiles.value, ...next]
  if (next[0]) active.value = next[0].id
  previewOpen.value = true
}

function clearLocal() {
  localFiles.value = []
  if (!sampleFiles.some((f) => f.id === active.value)) {
    active.value = sampleFiles[0]?.id
  }
}

function openAt(id: string | undefined) {
  if (!id) return
  active.value = id
  previewOpen.value = true
}

function resolveKind(f: FileViewerItem): FileViewerKind {
  if (f.kind) return f.kind
  const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext)) return 'video'
  if (ext === 'pdf') return 'pdf'
  if (['xlsx', 'xlsm', 'xlsb', 'csv'].includes(ext)) return 'sheet'
  if (ext === 'docx') return 'docx'
  return 'text'
}

function resolveMeta(f: FileViewerItem): string {
  if (f.size) {
    if (f.size < 1024) return `${f.size} B`
    if (f.size < 1024 * 1024) return `${(f.size / 1024).toFixed(1)} KB`
    return `${(f.size / 1024 / 1024).toFixed(1)} MB`
  }
  if (typeof f.src === 'string') {
    try {
      return new URL(f.src, window.location.href).hostname || '—'
    } catch {
      return '—'
    }
  }
  return '本地文件'
}

function onError(err: { file: FileViewerItem; error: unknown }) {
  console.error('[UFileViewer]', err.file.name, err.error)
}
</script>

<style scoped lang="scss">
.fv-demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1120px;
  margin: 0 auto;
}

.fv-demo__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 8px 4px 0;
}

.fv-demo__copy {
  max-width: 640px;
}

.fv-demo__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--u-color-primary);
}

.fv-demo__title {
  margin: 0 0 10px;
  font-size: 28px;
  line-height: 1.15;
  font-weight: 700;
  color: var(--u-text-color-title);
  letter-spacing: -0.01em;
}

.fv-demo__lede {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--u-text-color-second);
}

.fv-demo__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.fv-demo__files {
  border: 1px solid var(--u-border-color);
  border-radius: 12px;
  background: var(--u-bg-color-top);
  overflow: hidden;
}

.fv-demo__files-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--u-border-color);
}

.fv-demo__files-head h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--u-text-color-title);
}

.fv-demo__files-count {
  font-size: 12px;
  color: var(--u-text-color-second);
}

.fv-demo__files-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  display: grid;
  gap: 2px;
}

.fv-demo__file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.18s ease;

  &:hover {
    background: var(--u-bg-color-hover);
  }

  &--active {
    background: color-mix(in srgb, var(--u-color-primary) 12%, transparent);
  }
}

.fv-demo__file-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--u-text-color-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fv-demo__file-meta {
  font-size: 11.5px;
  color: var(--u-text-color-second);
  flex-shrink: 0;
}

.fv-demo__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--u-color-primary) 16%, transparent);
  color: var(--u-color-primary);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}
</style>
