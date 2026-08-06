<template>
  <div :class="cls.e('sheet')">
    <div v-if="unavailable" :class="cls.e('empty')">
      <u-empty text="无法预览表格：未安装 @veltra/sheet-core" :size="32" />
    </div>
    <template v-else>
      <div v-if="truncated" :class="cls.e('sheet-note')">
        共 {{ totalRows.toLocaleString() }} 行，超出预览上限
        {{ maxRows.toLocaleString() }} 行，已全量加载
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
    </template>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'
import { UEmpty } from '../../empty'
import { getExtension, toArrayBuffer } from '../helper'

defineOptions({ name: 'UFileViewerSheetPreviewer' })

/** 仅类型查询；运行时通过动态 import 加载，未安装时不炸主入口 */
type SheetCoreModule = typeof import('@veltra/sheet-core')
type Sheet = InstanceType<SheetCoreModule['Sheet']>
type SheetGrid = InstanceType<SheetCoreModule['SheetGrid']>

const props = withDefaults(defineProps<{ file: FileViewerItem; maxRows?: number }>(), {
  maxRows: 50_000
})

const emit = defineEmits<{ (e: 'error', err: unknown): void }>()

const cls = bem('file-viewer')
const container = useTemplateRef<HTMLDivElement>('container')
const loading = ref(true)
const unavailable = ref(false)
const truncated = ref(false)
const totalRows = ref(0)
const sheets = shallowRef<Sheet[]>([])
const activeSheetIndex = ref(0)

let controller: AbortController | undefined
/** 递增 token：importXlsx 无 AbortSignal，靠它防止切文件后旧解析结果落地 */
let loadToken = 0
let grid: SheetGrid | undefined
let sheetCore: SheetCoreModule | undefined

function releaseGrid() {
  grid?.release()
  grid = undefined
}

/** 动态加载 sheet-core；未安装 optional peer 时返回 undefined */
async function resolveSheetCore(): Promise<SheetCoreModule | undefined> {
  if (sheetCore) return sheetCore
  try {
    sheetCore = await import('@veltra/sheet-core')
    return sheetCore
  } catch {
    return undefined
  }
}

/** 解析文件为 Sheet 列表：xlsx 多表（importXlsx 建工作簿）；csv 单表，表名取文件名 */
async function parseFile(
  core: SheetCoreModule,
  file: FileViewerItem,
  signal?: AbortSignal
): Promise<Sheet[]> {
  const buf = await toArrayBuffer(file.src, signal)
  if (getExtension(file.name) === 'csv') {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    const sheet = new core.Sheet(file.name)
    core.importCsv(text, sheet)
    return [sheet]
  }
  const workbook = await core.importXlsx(buf)
  return workbook.getSheets()
}

function renderActive() {
  const sheet = sheets.value[activeSheetIndex.value]
  const el = container.value
  releaseGrid()
  if (!sheet || !el || !sheetCore) return

  // SheetGrid 的 rows 选项是渲染行数下限（构造时数据高水位恒并入渲染尺寸），
  // 不能用作行数上限；deleteRows 硬裁又会让引用被裁区域的公式显示 #REF!，
  // 故 maxRows 只驱动截断提示，不裁模型
  const total = sheet.rowCount
  totalRows.value = total
  truncated.value = props.maxRows > 0 && total > props.maxRows

  grid = new sheetCore.SheetGrid({ container: el, sheet, readonly: true })
}

async function load() {
  const token = ++loadToken
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  truncated.value = false
  releaseGrid()
  sheets.value = []
  activeSheetIndex.value = 0

  try {
    const core = await resolveSheetCore()
    if (token !== loadToken) return
    if (!core) {
      unavailable.value = true
      emit('error', new Error('未安装 @veltra/sheet-core，无法预览 Excel/CSV'))
      return
    }
    unavailable.value = false

    const parsed = await parseFile(core, props.file, controller.signal)
    if (token !== loadToken) return
    sheets.value = parsed
    renderActive()
  } catch (err) {
    if (token !== loadToken) return
    if ((err as { name?: string })?.name === 'AbortError') return
    emit('error', err)
  } finally {
    if (token === loadToken) loading.value = false
  }
}

watch(() => props.file, load, { immediate: true })
watch(activeSheetIndex, renderActive)

onBeforeUnmount(() => {
  controller?.abort()
  releaseGrid()
  sheets.value = []
})
</script>
