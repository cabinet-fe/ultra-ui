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
import { onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'

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

interface SheetData {
  name: string
  headers: string[]
  rows: string[][]
  totalCount: number
}

const sheets = shallowRef<SheetData[]>([])
const activeSheetIndex = ref(0)

let controller: AbortController | undefined
let instance: { release?: () => void; resize?: () => void } | undefined
let resizeObserver: ResizeObserver | undefined

async function load() {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  loading.value = true
  sheets.value = []
  activeSheetIndex.value = 0

  try {
    const ext = props.file.name.slice(props.file.name.lastIndexOf('.') + 1).toLowerCase()
    const { toArrayBuffer, parseCsv } = await import('../helper')
    const buf = await toArrayBuffer(props.file.src, signal)
    if (signal.aborted) return

    if (ext === 'csv') {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buf)
      const parsed = parseCsv(text).filter((row) => row.some((c) => c.length > 0))
      const headers = parsed[0] ?? []
      const rows = parsed.slice(1)
      sheets.value = [
        {
          name: props.file.name,
          headers: headers.map((h, i) => String(h) || `Column ${i + 1}`),
          rows,
          totalCount: rows.length
        }
      ]
    } else {
      const { readWorkbook } = await import('@cat-kit/excel')
      const workbook = await readWorkbook(new Uint8Array(buf))
      if (signal.aborted) return
      sheets.value = workbook.worksheets.map((ws) => {
        const wsRows = ws.getRows()
        const firstRow = wsRows[0]
        const headers = firstRow ? firstRow.toValues().map((v) => cellToString(v)) : []
        const rows = wsRows.slice(1).map((r) => r.toValues().map(cellToString))
        return {
          name: ws.name,
          headers: headers.map((h, i) => h || `Column ${i + 1}`),
          rows,
          totalCount: rows.length
        }
      })
    }

    await renderActive()
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return
    emit('error', err)
  } finally {
    loading.value = false
  }
}

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toLocaleString()
  if (typeof v === 'object' && v !== null && 'formula' in v) {
    const f = v as { formula: string; result?: unknown }
    if (f.result !== undefined && f.result !== null) return cellToString(f.result)
    return `=${f.formula}`
  }
  return String(v)
}

async function renderActive() {
  const sheet = sheets.value[activeSheetIndex.value]
  if (!sheet || !container.value) return

  releaseInstance()

  const limit = props.maxRows > 0 ? Math.min(props.maxRows, sheet.rows.length) : sheet.rows.length
  totalRows.value = sheet.totalCount
  renderedRows.value = limit
  truncated.value = props.maxRows > 0 && sheet.rows.length > props.maxRows

  const columns = sheet.headers.map((h, i) => ({
    field: 'c' + i,
    title: h,
    width: 'auto' as const
  }))

  const records: Record<string, string>[] = []
  for (let i = 0; i < limit; i++) {
    const row = sheet.rows[i]
    if (!row) continue
    const record: Record<string, string> = {}
    for (let j = 0; j < columns.length; j++) {
      record['c' + j] = row[j] ?? ''
    }
    records.push(record)
  }

  const VTable = await import('@visactor/vtable')
  if (!container.value) return

  instance = new VTable.ListTable(container.value, {
    records,
    columns,
    widthMode: 'standard',
    heightMode: 'standard',
    defaultRowHeight: 32,
    defaultHeaderRowHeight: 36,
    autoFillWidth: true,
    frozenColCount: 0,
    theme: (VTable.themes.ARCO ?? VTable.themes.DEFAULT).extends({
      defaultStyle: { borderLineWidth: 1 }
    })
  })
}

function releaseInstance() {
  if (instance && typeof instance.release === 'function') {
    try {
      instance.release()
    } catch {
      /* noop */
    }
  }
  instance = undefined
}

watch(
  () => props.file,
  () => load(),
  { immediate: true }
)

watch(activeSheetIndex, () => renderActive())

watch(container, (el) => {
  resizeObserver?.disconnect()
  if (!el) return
  resizeObserver = new ResizeObserver(() => {
    instance?.resize?.()
  })
  resizeObserver.observe(el)
})

onBeforeUnmount(() => {
  controller?.abort()
  resizeObserver?.disconnect()
  releaseInstance()
  sheets.value = []
})
</script>
