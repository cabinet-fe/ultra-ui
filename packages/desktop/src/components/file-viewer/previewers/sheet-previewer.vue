<template>
  <div :class="cls.e('sheet')">
    <div v-if="truncated" :class="cls.e('sheet-note')">
      仅展示前 {{ renderedRows.toLocaleString() }} 行（共 {{ totalRows.toLocaleString() }} 行）
    </div>
    <div v-if="sheets.length > 1" :class="cls.e('sheet-tabs')">
      <button
        v-for="(s, i) in sheets"
        :key="s.name"
        :class="[cls.e('sheet-tab'), bem.is('active', i === activeSheetIndex)]"
        @click="activeSheetIndex = i"
      >
        {{ s.name }}
      </button>
    </div>
    <div ref="container" :class="cls.e('sheet-stage')" />
    <div v-if="loading" :class="cls.e('loading')">加载中…</div>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { ListTable } from '@visactor/vtable'
import { onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'
import { parseSheetFile, type SheetPreview } from '../sheet-parser'

defineOptions({ name: 'FileViewerSheetPreviewer' })

const props = withDefaults(defineProps<{ file: FileViewerItem; maxRows?: number }>(), {
  maxRows: 50_000
})

const emit = defineEmits<{ (e: 'error', err: unknown): void }>()

const cls = bem('file-viewer')
const container = useTemplateRef<HTMLDivElement>('container')
const loading = ref(true)
const truncated = ref(false)
const totalRows = ref(0)
const renderedRows = ref(0)
const sheets = shallowRef<SheetPreview[]>([])
const activeSheetIndex = ref(0)

let controller: AbortController | undefined
let table: ListTable | undefined
let resizeObserver: ResizeObserver | undefined

function releaseTable() {
  table?.release()
  table = undefined
}

function renderActive() {
  const sheet = sheets.value[activeSheetIndex.value]
  const el = container.value
  if (!sheet || !el) return

  releaseTable()

  const limit = props.maxRows > 0 ? Math.min(props.maxRows, sheet.rows.length) : sheet.rows.length
  totalRows.value = sheet.rows.length
  renderedRows.value = limit
  truncated.value = props.maxRows > 0 && sheet.rows.length > props.maxRows

  table = new ListTable(el, {
    records: sheet.rows.slice(0, limit),
    columns: sheet.headers.map((title, i) => ({ field: String(i), title, width: 'auto' })),
    widthMode: 'standard'
  })
}

async function load() {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  sheets.value = []
  activeSheetIndex.value = 0

  try {
    sheets.value = await parseSheetFile(props.file, controller.signal)
    if (controller.signal.aborted) return
    renderActive()
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return
    emit('error', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.file, load, { immediate: true })
watch(activeSheetIndex, renderActive)
watch(container, (el) => {
  resizeObserver?.disconnect()
  if (!el) return
  resizeObserver = new ResizeObserver(() => table?.resize?.())
  resizeObserver.observe(el)
})

onBeforeUnmount(() => {
  controller?.abort()
  resizeObserver?.disconnect()
  releaseTable()
  sheets.value = []
})
</script>
