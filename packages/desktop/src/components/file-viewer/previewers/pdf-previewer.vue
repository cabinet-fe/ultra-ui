<template>
  <div :class="cls.e('pdf')" v-bind="attrs">
    <div v-if="failed" :class="cls.e('pdf-failed')">PDF 加载失败</div>
    <div v-else-if="!pdfDoc" :class="cls.e('loading')">正在加载 PDF…</div>
    <div
      v-else
      ref="viewportEl"
      :class="cls.e('pdf-viewport')"
      @scroll="updateWindow"
      @wheel="onWheel"
    >
      <div
        v-for="(size, i) in sizes"
        :key="i"
        :class="cls.e('pdf-page')"
        :style="{ width: withUnit(size.width, 'px'), height: withUnit(size.height, 'px') }"
      >
        <!-- 仅渲染窗口内的页面挂 canvas，节点数小于总页数即缓冲生效 -->
        <canvas v-if="inWindow(i)" :ref="canvasRef(i)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 懒加载 chunk 首条 import：保证 polyfill 先于 pdfjs 主线程代码求值（Chrome 103）
import './pdf-polyfill'
import { bem, withUnit } from '@veltra/utils'
import { getDocument, PDFWorker, RenderingCancelledException } from 'pdfjs-dist'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  useAttrs,
  useTemplateRef,
  watch
} from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, clampRenderScale, clampZoom, toBlobUrl } from '../helper'

defineOptions({ name: 'UFileViewerPdfPreviewer', inheritAttrs: false })

const props = defineProps<{ file: FileViewerItem; resourceUrl?: string }>()

const emit = defineEmits<{
  (e: 'error', err: unknown): void
  (e: 'zoom-change', level: number): void
}>()

const cls = bem('file-viewer')
const attrs = useAttrs()

/** 视口外各方向多渲染的页数，对齐原 ScrollPlugin defaultBufferSize: 2 */
const RENDER_BUFFER = 2

interface PageSize {
  width: number
  height: number
}

const pdfDoc = shallowRef<PDFDocumentProxy | null>(null)
/** 加载失败态：worker 构造 / 文档拉取 / 首页读取任一环节失败即置位，避免 loading 永驻 */
const failed = shallowRef(false)
const viewportEl = useTemplateRef<HTMLDivElement>('viewportEl')
/** 各页 scale=1 尺寸；先以第 1 页尺寸占位，渲染到该页时修正 */
const baseSizes = shallowRef<PageSize[]>([])
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

/** wheel 合帧状态：目标 zoom 累积到帧回调统一应用，避免每 tick 全量重渲染 */
let wheelZoomTarget: number | null = null
let wheelRafId = 0

function inWindow(i: number): boolean {
  return i >= win.value.start && i <= win.value.end
}

/** 计算 fit-page 级别；容器未挂载或任一边为 0（display:none 等）时返回 null 表示暂不可算 */
function fitLevel(): number | null {
  const el = viewportEl.value
  if (!el || !base) return null
  if (!el.clientWidth || !el.clientHeight) return null
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
  const level = fitLevel()
  if (level === null) return
  applyZoom(level, true)
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
  // rAF 合帧：目标级别先累积，每帧只触发一次 cancelRenders + 重渲染
  wheelZoomTarget = (wheelZoomTarget ?? zoom.value) + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP)
  if (wheelRafId) return
  wheelRafId = requestAnimationFrame(() => {
    wheelRafId = 0
    const target = wheelZoomTarget
    wheelZoomTarget = null
    if (target !== null) applyZoom(target, false)
  })
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
  if (next.start !== win.value.start || next.end !== win.value.end) {
    evictOutOfWindowPages(next)
    win.value = next
  }
}

/** 窗口滑出后释放页代理资源（IR / 位图），防止长文档滚动后内存常驻；
 *  page.cleanup() 对渲染中的页安全（跳过并返回 false），滚动回来会按需重建 */
function evictOutOfWindowPages(next: { start: number; end: number }) {
  for (const i of pagePromises.keys()) {
    if (i >= next.start && i <= next.end) continue
    void pagePromises.get(i)?.then((page) => page?.cleanup())
  }
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
  const page = await getPage(doc, i)
  // 等待期间可能已切文件 / 卸载 / canvas 卸载，先于一切渲染副作用拦截
  if (g !== gen || canvases.get(i) !== canvas || !page) return

  // 确认本轮渲染成立后才取消旧任务并清出 Map。必须在守卫之后——若提到首个 await 之前，
  // 前一次调用尚未把 RenderTask 写入 Map，取消打不中，同一 canvas 会并发两个渲染任务，
  // pdfjs 抛 "Cannot use the same canvas during multiple render() operations"
  renderTasks.get(i)?.cancel()
  renderTasks.delete(i)

  // 修正与第 1 页不同的页面尺寸（混合尺寸文档）
  const unit = page.getViewport({ scale: 1 })
  const known = baseSizes.value[i]
  if (known && (known.width !== unit.width || known.height !== unit.height)) {
    baseSizes.value = baseSizes.value.map((s, idx) =>
      idx === i ? { width: unit.width, height: unit.height } : s
    )
  }

  // canvas 物理分辨率按 devicePixelRatio 放大，CSS 尺寸由占位样式 100% 拉伸；
  // 超大页面 × 高 dpr × 大 zoom 会超出 Chrome canvas 上限（单边 32767 安全值、面积 2^28）
  // 导致静默白屏，超限时按比例降采样，只损失分辨率不改变布局
  const dpr = window.devicePixelRatio || 1
  const raw = zoom.value * dpr
  const viewport = page.getViewport({ scale: raw * clampRenderScale(unit.width, unit.height, raw) })
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
  if (g !== gen) return
  if (!first) {
    failed.value = true
    return
  }

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
  if (wheelRafId) {
    cancelAnimationFrame(wheelRafId)
    wheelRafId = 0
  }
  wheelZoomTarget = null
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
  failed.value = false
  baseSizes.value = []
  win.value = { start: 0, end: -1 }
  zoom.value = 1
  isFitPage.value = true
}

/** 拼接资源子目录 URL，容忍 resourceUrl 尾斜杠差异 */
function resourceDir(root: string, dir: string): string {
  return `${root.endsWith('/') ? root : `${root}/`}${dir}`
}

function load() {
  cleanup()
  failed.value = false
  const g = ++gen

  const r = toBlobUrl(props.file.src, props.file.mime ?? 'application/pdf')
  revoke = r.revoke

  // CJK 中文 PDF 与 JPEG2000 扫描件需要 cmaps / standard_fonts / wasm 资源目录，
  // 由使用方经 resourceUrl 指向随 dist 分发的目录；未传时与原先行为一致
  const root = props.resourceUrl
  const assets = root
    ? {
        cMapUrl: resourceDir(root, 'cmaps/'),
        cMapPacked: true,
        standardFontDataUrl: resourceDir(root, 'standard_fonts/'),
        wasmUrl: resourceDir(root, 'wasm/')
      }
    : {}

  let w: Worker
  let pw: PDFWorker
  let task: PDFDocumentLoadingTask
  try {
    // worker 产物由构建工具随 dist 分发（首模块为 Chrome 103 polyfill + 内联 pdf.worker）
    w = new Worker(new URL('./pdf-worker-wrapper.js', import.meta.url), { type: 'module' })
    pw = new PDFWorker({ port: w })
    task = getDocument({ url: r.url, worker: pw, ...assets })
  } catch (err) {
    // Worker 构造同步抛错（产物缺失 / CSP 拦截等）：置错误态而非永驻 loading
    failed.value = true
    emit('error', err)
    return
  }
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
      failed.value = true
      emit('error', err)
    })
}

// ---- 视口挂载：ResizeObserver 跟随尺寸变化 + 指针拖拽平移（原生滚动条已隐藏） ----
let panState:
  | { pointerId: number; startX: number; startY: number; scrollLeft: number; scrollTop: number }
  | undefined

// RO 与 pan 监听都随视口元素的生命周期走，清理收敛到 onCleanup 单点：
// 同时覆盖「watch 因元素重挂载重跑前」与「组件作用域销毁」两条路径
watch(
  viewportEl,
  (el, _, onCleanup) => {
    if (!el) return

    const observer = new ResizeObserver(() => {
      if (isFitPage.value) updateFit()
      else updateWindow()
    })
    observer.observe(el)

    const handlePointerDown = (e: PointerEvent) => {
      // 已在拖拽中或非主指针（多指触控）不再进入平移
      if (panState || !e.isPrimary || e.button !== 0) return
      panState = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop
      }
      el.classList.add('is-panning')
      el.setPointerCapture(e.pointerId)
      e.preventDefault()
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!panState || panState.pointerId !== e.pointerId) return
      el.scrollLeft = panState.scrollLeft - (e.clientX - panState.startX)
      el.scrollTop = panState.scrollTop - (e.clientY - panState.startY)
    }

    const endPan = (e: PointerEvent) => {
      if (!panState || panState.pointerId !== e.pointerId) return
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId)
      }
      el.classList.remove('is-panning')
      panState = undefined
    }

    el.addEventListener('pointerdown', handlePointerDown, { capture: true })
    el.addEventListener('pointermove', handlePointerMove, { capture: true })
    el.addEventListener('pointerup', endPan, { capture: true })
    el.addEventListener('pointercancel', endPan, { capture: true })

    onCleanup(() => {
      observer.disconnect()
      el.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      el.removeEventListener('pointermove', handlePointerMove, { capture: true })
      el.removeEventListener('pointerup', endPan, { capture: true })
      el.removeEventListener('pointercancel', endPan, { capture: true })
      el.classList.remove('is-panning')
      panState = undefined
    })
  },
  { immediate: true, flush: 'post' }
)

// 只盯 src：宿主 normalizedFiles 每次重算都会生成新对象，按 file 引用比较会导致
// 同一文件被整体重载（worker / blob URL 重建、滚动位置丢失）；string 值比较、二进制引用比较
watch(
  () => props.file.src,
  () => load(),
  { immediate: true }
)

onBeforeUnmount(() => {
  // RO 与 pan 监听由上方 watch 的 onCleanup 覆盖，这里只销毁文档会话
  cleanup()
})

defineExpose({ zoomIn, zoomOut, resetZoom })
</script>
