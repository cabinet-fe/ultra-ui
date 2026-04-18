<template>
  <div class="fv-demo">
    <header class="fv-demo__head">
      <div class="fv-demo__copy">
        <p class="fv-demo__eyebrow">UFileViewer</p>
        <h2 class="fv-demo__title">一个面板，预览所有常用格式</h2>
        <p class="fv-demo__lede">
          图片 / 视频 / PDF / XLSX / CSV / DOCX / TXT
          都在这里。侧栏切换、懒加载预览器、切换时即时释放上一份内存。
        </p>
      </div>
      <div class="fv-demo__pick">
        <u-file-picker multiple accept="*" @pick="onPick">
          <u-button type="primary">加入预览</u-button>
        </u-file-picker>
        <u-button v-if="localCount > 0" @click="clearLocal">清空本地文件</u-button>
      </div>
    </header>

    <div class="fv-demo__viewer">
      <u-file-viewer v-model="active" :files="files" @error="onError" />
    </div>

    <section class="fv-demo__notes">
      <h4>样例资源</h4>
      <ul>
        <li v-for="f in sampleFiles" :key="f.name">
          <span class="fv-demo__chip">{{ (f.kind || 'AUTO').toUpperCase() }}</span>
          <span>{{ f.name }}</span>
          <a v-if="typeof f.src === 'string'" :href="f.src" target="_blank" rel="noopener">
            {{ f.src }}
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { FileViewerItem } from '@veltra/desktop'
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
      '  - 表格 (字节 VTable + @cat-kit/excel)',
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
  {
    id: 'sample-csv',
    name: 'sales-summary.csv',
    src: sampleCsv,
    kind: 'sheet'
  },
  {
    id: 'sample-txt',
    name: 'readme.txt',
    src: sampleTxt,
    kind: 'text'
  }
]

const localFiles = shallowRef<FileViewerItem[]>([])
const active = ref<string | undefined>(sampleFiles[0]?.id)

const files = computed<FileViewerItem[]>(() => [...sampleFiles, ...localFiles.value])

const localCount = computed(() => localFiles.value.length)

function onPick(picked: File[]) {
  const next: FileViewerItem[] = picked.map((f, i) => ({
    id: `local-${Date.now()}-${i}`,
    name: f.name,
    src: f,
    size: f.size,
    mime: f.type
  }))
  localFiles.value = [...localFiles.value, ...next]
  if (next[0]) active.value = next[0].id
}

function clearLocal() {
  localFiles.value = []
  if (!sampleFiles.some((f) => f.id === active.value)) {
    active.value = sampleFiles[0]?.id
  }
}

function onError(err: { file: FileViewerItem; error: unknown }) {
  console.error('[UFileViewer]', err.file.name, err.error)
}
</script>

<style scoped lang="scss">
.fv-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.fv-demo__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 8px 4px;
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
  line-height: 1.55;
  color: var(--u-text-color-second);
}

.fv-demo__pick {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.fv-demo__viewer {
  height: 72vh;
  min-height: 560px;
}

.fv-demo__notes {
  padding: 16px 20px 20px;
  border: 1px solid var(--u-border-color);
  border-radius: 12px;
  background: var(--u-bg-color-top);
}

.fv-demo__notes h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--u-text-color-title);
}

.fv-demo__notes ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.fv-demo__notes li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: var(--u-text-color-second);
}

.fv-demo__notes a {
  color: var(--u-color-primary);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
