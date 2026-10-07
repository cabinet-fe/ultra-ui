<template>
  <div :class="cls.e('pdf')" v-bind="attrs">
    <div v-if="!pdfDoc" :class="cls.e('loading')">正在加载 PDF…</div>
    <div
      v-else
      ref="viewportEl"
      :class="cls.e('pdf-viewport')"
      @scroll="updateWindow"
      @wheel="onWheel"
    >
      <PdfViewportScroll :viewport="viewportEl">
        <div
          v-for="(size, i) in sizes"
          :key="i"
          :class="cls.e('pdf-page')"
          :style="{ width: size.width + 'px', height: size.height + 'px' }"
        >
          <!-- 仅渲染窗口内的页面挂 canvas，节点数小于总页数即缓冲生效 -->
          <canvas
            v-if="inWindow(i)"
            :ref="canvasRef(i)"
            style="display: block; width: 100%; height: 100%"
          />
        </div>
      </PdfViewportScroll>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 懒加载 chunk 首条 import：保证 polyfill 先于 pdfjs 主线程代码求值（Chrome 103）
import './pdf-polyfill'
import { bem } from '@veltra/utils'
import { getDocument, PDFWorker, RenderingCancelledException } from 'pdfjs-dist'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useAttrs, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'
import { toBlobUrl } from '../helper'
import PdfViewportScroll from './pdf-viewport-scroll.vue'

defineOptions({ name: 'UFileViewerPdfPreviewer', inheritAttrs: false })

const props = defineProps<{ file: FileViewerItem }>()

const emit = defineEmits<{
  (e: 'error', err: unknown): void
  (e: 'zoom-change', level: number): void
}>()

const cls = bem('file-viewer')
const attrs = useAttrs()

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1
/** 视口外各方向多渲染的页数，对齐原 ScrollPlugin defaultBufferSize: 2 */
const RENDER_BUFFER = 2

interface PageSize {
  width: number
  height: number
}

const pdfDoc = shallowRef<PDFDocumentProxy | null>(null)
const viewportEl = shallowRef<HTMLDivElement | null>(null)
/** 各页 scale=1 尺寸；先以第 1 页尺寸占位，渲染到该页时修正 */
const baseSizes = ref<PageSize[]>([])
const zoom = ref(1)
const isFitPage = ref(true)
/** 渲染窗口（含缓冲），窗口内页面挂载 canvas */
const win = shallowRef({ start: 0, end: -1 })

const sizes = computed<PageSize[]>(() => {
  const level = zoom.value
  return baseSizes.value.map((s) => ({
    width: Math.round(s.width * level),
    height: Math.round(s.height * level)
  }))
})

// ---- 每份文档的会话状态（非响应式，随文档销毁重建） ----
/** 递增代数：切文件 / 销毁后使旧文档的异步回调全部失效 */
let gen = 0
let worker: Worker | null = null
let pdfWorker: PDFWorker | null = null
let loadingTask: PDFDocumentLoadingTask | null = null
let revoke: (() => void) | undefined
/** 第 1 页 scale=1 尺寸，fit-page 基准 */
let base: PageSize | null = null
const pagePromises = new Map<number, Promise<PDFPageProxy | null>>()
const canvases = new Map<number, HTMLCanvasElement>()
const renderTasks = new Map<number, RenderTask>()

function clampZoom(level: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(level * 100) / 100))
}

function inWindow(i: number): boolean {
  return i >= win.value.start && i <= win.value.end
}

function fitLevel(): number {
  const el = viewportEl.value
  if (!el || !base) return zoom.value
  return clampZoom(Math.min(el.clientWidth / base.width, el.clientHeight / base.height))
}

/** 记录视口中心所在页与页内比例，缩放后保持内容位置 */
function locateCenter(): { idx: number; ratio: number } | null {
  const el = viewportEl.value
  if (!el) return null
  const center = el.scrollTop + el.clientHeight / 2
  const children = el.children
  for (let i = 0; i < children.length; i++) {
    const c = children[i] as HTMLElement
    if (center < c.offsetTop + c.offsetHeight || i === children.length - 1) {
      return { idx: i, ratio: c.offsetHeight ? (center - c.offsetTop) / c.offsetHeight : 0 }
    }
  }
  return null
}

function applyZoom(level: number, fit: boolean) {
  const next = clampZoom(level)
  if (next === zoom.value && fit === isFitPage.value) return

  cancelRenders()
  const hit = locateCenter()
  zoom.value = next
  isFitPage.value = fit
  emit('zoom-change', next)

  void nextTick(() => {
    const el = viewportEl.value
    const target = el?.children[hit?.idx ?? -1] as HTMLElement | undefined
    if (el && hit && target) {
      el.scrollTop = target.offsetTop + hit.ratio * target.offsetHeight - el.clientHeight / 2
    }
    rerenderWindow()
  })
}

function updateFit() {
  applyZoom(fitLevel(), true)
}

function zoomIn() {
  if (pdfDoc.value) applyZoom(zoom.value + ZOOM_STEP, false)
}

function zoomOut() {
  if (pdfDoc.value) applyZoom(zoom.value - ZOOM_STEP, false)
}

function resetZoom() {
  if (!pdfDoc.value) return
  updateFit()
}

function onWheel(e: WheelEvent) {
  if (!pdfDoc.value || !(e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  applyZoom(zoom.value + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP), false)
}

/** 按占位元素实际位置计算可见范围并外扩缓冲 */
function updateWindow() {
  const el = viewportEl.value
  if (!el || !baseSizes.value.length) return

  const top = el.scrollTop
  const bottom = top + el.clientHeight
  const children = el.children
  let start = -1
  let end = -1
  for (let i = 0; i < children.length; i++) {
    const c = children[i] as HTMLElement
    if (c.offsetTop + c.offsetHeight < top) continue
    if (c.offsetTop > bottom) break
    if (start === -1) start = i
    end = i
  }
  if (start === -1) return
  const next = {
    start: Math.max(0, start - RENDER_BUFFER),
    end: Math.min(children.length - 1, end + RENDER_BUFFER)
  }
  // 范围未变时不替换引用，避免滚动期间反复触发 v-for 重渲染
  if (next.start !== win.value.start || next.end !== win.value.end) win.value = next
}

// 按 index 缓存函数式 ref，保持跨渲染引用稳定，避免每次 patch 触发 ref 重放
const canvasRefFns = new Map<number, (el: unknown) => void>()

function canvasRef(i: number): (el: unknown) => void {
  let fn = canvasRefFns.get(i)
  if (!fn) {
    fn = (el: unknown) => setCanvasRef(i, el)
    canvasRefFns.set(i, fn)
  }
  return fn
}

function setCanvasRef(i: number, el: unknown) {
  const canvas = el as HTMLCanvasElement | null
  if (!canvas) {
    if (canvases.get(i)) {
      renderTasks.get(i)?.cancel()
      renderTasks.delete(i)
      canvases.delete(i)
    }
    return
  }
  // 函数式 ref 每次补丁都会重跑，已挂载的 canvas 不重复渲染
  if (canvases.get(i) === canvas) return
  canvases.set(i, canvas)
  void renderPage(i)
}

function cancelRenders() {
  for (const task of renderTasks.values()) task.cancel()
  renderTasks.clear()
}

function rerenderWindow() {
  cancelRenders()
  for (const i of canvases.keys()) void renderPage(i)
}

function getPage(doc: PDFDocumentProxy, index: number): Promise<PDFPageProxy | null> {
  let p = pagePromises.get(index)
  if (!p) {
    p = doc.getPage(index + 1).catch((err) => {
      emit('error', err)
      return null
    })
    pagePromises.set(index, p)
  }
  return p
}

async function renderPage(i: number) {
  const doc = pdfDoc.value
  const canvas = canvases.get(i)
  if (!doc || !canvas) return

  const g = gen
  renderTasks.get(i)?.cancel()
  renderTasks.delete(i)

  const page = await getPage(doc, i)
  if (g !== gen || canvases.get(i) !== canvas || !page) return

  // 修正与第 1 页不同的页面尺寸（混合尺寸文档）
  const unit = page.getViewport({ scale: 1 })
  const known = baseSizes.value[i]
  if (known && (known.width !== unit.width || known.height !== unit.height)) {
    baseSizes.value = baseSizes.value.map((s, idx) =>
      idx === i ? { width: unit.width, height: unit.height } : s
    )
  }

  // canvas 物理分辨率按 devicePixelRatio 放大，CSS 尺寸由占位样式决定
  const dpr = window.devicePixelRatio || 1
  const viewport = page.getViewport({ scale: zoom.value * dpr })
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const task = page.render({ canvasContext: ctx, viewport })
  renderTasks.set(i, task)
  try {
    await task.promise
  } catch (err) {
    // 主动取消（切页/缩放/销毁）不算错误
    if (g === gen && !(err instanceof RenderingCancelledException)) emit('error', err)
  } finally {
    if (renderTasks.get(i) === task) renderTasks.delete(i)
  }
}

async function initDoc(doc: PDFDocumentProxy, g: number) {
  const first = await getPage(doc, 0)
  if (g !== gen || !first) return

  const unit = first.getViewport({ scale: 1 })
  base = { width: unit.width, height: unit.height }
  baseSizes.value = Array.from({ length: doc.numPages }, () => ({ ...base! }))

  await nextTick()
  updateFit()
  await nextTick()
  updateWindow()
}

function cleanup() {
  gen++
  cancelRenders()
  canvases.clear()
  canvasRefFns.clear()
  pagePromises.clear()

  const task = loadingTask
  const pw = pdfWorker
  const w = worker
  loadingTask = null
  pdfWorker = null
  worker = null
  // 外部 port 的 PDFWorker 不会被 loadingTask.destroy() 终止，需手动回收
  if (task) {
    void task
      .destroy()
      .catch(() => {})
      .finally(() => {
        pw?.destroy()
        w?.terminate()
      })
  }

  revoke?.()
  revoke = undefined
  base = null
  pdfDoc.value = null
  baseSizes.value = []
  win.value = { start: 0, end: -1 }
  zoom.value = 1
  isFitPage.value = true
}

function load() {
  cleanup()
  const g = ++gen

  const r = toBlobUrl(props.file.src, props.file.mime ?? 'application/pdf')
  revoke = r.revoke

  // worker 产物由构建工具随 dist 分发（首模块为 Chrome 103 polyfill + 内联 pdf.worker）
  const w = new Worker(new URL('./pdf-worker-wrapper.js', import.meta.url), { type: 'module' })
  const pw = new PDFWorker({ port: w })
  const task = getDocument({ url: r.url, worker: pw })
  worker = w
  pdfWorker = pw
  loadingTask = task

  task.promise
    .then((doc) => {
      if (g !== gen) {
        void doc.destroy()
        return
      }
      pdfDoc.value = doc
      return initDoc(doc, g)
    })
    .catch((err) => {
      if (g !== gen) return
      emit('error', err)
    })
}

// ---- 视口尺寸变化：fit-page 跟随重算，否则重算渲染窗口 ----
let resizeObserver: ResizeObserver | undefined

watch(
  viewportEl,
  (el, _, onCleanup) => {
    resizeObserver?.disconnect()
    resizeObserver = undefined
    if (!el) return
    resizeObserver = new ResizeObserver(() => {
      if (isFitPage.value) updateFit()
      else updateWindow()
    })
    resizeObserver.observe(el)
    onCleanup(() => {
      resizeObserver?.disconnect()
      resizeObserver = undefined
    })
  },
  { immediate: true, flush: 'post' }
)

watch(
  () => props.file,
  () => load(),
  { immediate: true }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = undefined
  cleanup()
})

defineExpose({ zoomIn, zoomOut, resetZoom })
</script>
