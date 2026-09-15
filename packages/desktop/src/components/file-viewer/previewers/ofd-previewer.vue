<template>
  <div :class="cls.e('ofd')">
    <div v-if="unavailable" :class="cls.e('empty')">
      <u-empty text="无法预览 OFD：未安装 @veltra/ofd-core" :size="32" />
    </div>
    <template v-else>
      <div ref="scroll" :class="cls.e('ofd-scroll')">
        <div
          v-for="(page, i) in pages"
          :key="i"
          :data-index="i"
          :class="cls.e('ofd-page')"
          :style="{
            width: page.widthPx * zoomLevel + 'px',
            height: page.heightPx * zoomLevel + 'px'
          }"
        >
          <div v-if="page.svg" :class="cls.e('ofd-page-body')" v-html="page.svg" />
        </div>
        <div v-if="!pages.length && !loading" :class="cls.e('empty')">
          <u-empty text="该文件没有可预览的页面" :size="32" />
        </div>
      </div>
      <div v-if="loading" :class="cls.e('loading')">正在解析 OFD…</div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'
import { UEmpty } from '../../empty'
import { toArrayBuffer } from '../helper'

defineOptions({ name: 'UFileViewerOfdPreviewer' })

/** 仅类型查询；运行时通过动态 import 加载，未安装时不炸主入口 */
type OfdCoreModule = typeof import('@veltra/ofd-core')
type OfdContainer = import('@veltra/ofd-core').OfdContainer
type OfdZip = import('@veltra/ofd-core').OfdZip

/** OFD 毫米 → CSS 像素（96dpi），与内核 SVG 输出的换算一致 */
const PX_PER_MM = 96 / 25.4

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
/** 每次缩放固定增减 10%，对齐 pdf 缩放配置 */
const ZOOM_STEP = 0.1
/** 可视区上下各预渲染一个视口高度的页 */
const RENDER_MARGIN = '100% 0px'

interface OfdPageView {
  docIndex: number
  pageIndex: number
  /** 页面基准尺寸（缩放 1 时），毫米按 96dpi 换算为像素 */
  widthPx: number
  heightPx: number
  /** null = 未渲染；'' = 已尝试但渲染失败，不再重试 */
  svg: string | null
}

const props = defineProps<{ file: FileViewerItem }>()

const emit = defineEmits<{
  (e: 'error', err: unknown): void
  (e: 'zoom-change', level: number): void
}>()

const cls = bem('file-viewer')
const scrollEl = useTemplateRef<HTMLDivElement>('scroll')
const loading = ref(true)
const unavailable = ref(false)
const pages = ref<OfdPageView[]>([])
const zoomLevel = ref(1)

let controller: AbortController | undefined
/** 递增 token：防止切文件后旧解析/渲染结果落地 */
let loadToken = 0
let ofdCore: OfdCoreModule | undefined
let observer: IntersectionObserver | undefined
let activeZip: OfdZip | undefined
let activeContainer: OfdContainer | undefined
/** 已进入渲染流程（进行中或已完成）的页，防止滚动重复触发 */
const scheduledPages = new Set<number>()

// ---- 缩放：作用于页面容器尺寸，滚动高度随之自适应 ----

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100))
}

function setZoom(value: number) {
  const next = clampZoom(value)
  if (zoomLevel.value === next) return
  zoomLevel.value = next
  emit('zoom-change', next)
}

function zoomIn() {
  setZoom(zoomLevel.value + ZOOM_STEP)
}

function zoomOut() {
  setZoom(zoomLevel.value - ZOOM_STEP)
}

function resetZoom() {
  setZoom(1)
}

defineExpose({ zoomIn, zoomOut, resetZoom })

// ---- 解析与懒渲染 ----

/** 动态加载 ofd-core；未安装 optional peer 时返回 undefined */
async function resolveOfdCore(): Promise<OfdCoreModule | undefined> {
  if (ofdCore) return ofdCore
  try {
    ofdCore = await import('@veltra/ofd-core')
    return ofdCore
  } catch {
    return undefined
  }
}

function teardownRender() {
  observer?.disconnect()
  observer = undefined
  activeZip = undefined
  activeContainer = undefined
  scheduledPages.clear()
}

function observePages() {
  const root = scrollEl.value
  if (!root || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    (entries) => {
      const token = loadToken
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer?.unobserve(entry.target)
        const index = Number((entry.target as HTMLElement).dataset.index)
        if (Number.isNaN(index) || scheduledPages.has(index)) continue
        scheduledPages.add(index)
        void renderPage(index, token)
      }
    },
    { root, rootMargin: RENDER_MARGIN }
  )
  for (const el of root.querySelectorAll<HTMLElement>('[data-index]')) {
    observer.observe(el)
  }
}

/** 渲染单页 SVG；失败置空串避免滚动时反复重试同一页 */
async function renderPage(index: number, token: number) {
  const page = pages.value[index]
  const core = ofdCore
  if (!page || page.svg !== null || !core || !activeZip || !activeContainer) return
  try {
    const svg = await core.pageToSvg(activeZip, activeContainer, page.docIndex, page.pageIndex)
    if (token !== loadToken) return
    pages.value[index] = { ...page, svg }
  } catch (err) {
    if (token !== loadToken) return
    pages.value[index] = { ...page, svg: '' }
    emit('error', err)
  }
}

async function load() {
  const token = ++loadToken
  controller?.abort()
  controller = new AbortController()
  teardownRender()
  loading.value = true
  unavailable.value = false
  pages.value = []

  try {
    const core = await resolveOfdCore()
    if (token !== loadToken) return
    if (!core) {
      unavailable.value = true
      emit('error', new Error('未安装 @veltra/ofd-core，无法预览 OFD'))
      return
    }

    const buf = await toArrayBuffer(props.file.src, controller.signal)
    if (token !== loadToken) return
    const zip = core.openOfdZip(new Uint8Array(buf))
    const container = await core.parseOfdContainer(zip)
    if (token !== loadToken) return

    activeZip = zip
    activeContainer = container
    // 未声明尺寸时按 A4 兜底，与内核 pageToSvg 的兜底一致
    pages.value = container.docs.flatMap((doc, docIndex) =>
      doc.pages.map((page) => {
        const size = page.size ?? doc.pageSize ?? { width: 210, height: 297 }
        return {
          docIndex,
          pageIndex: page.index,
          widthPx: Math.round(size.width * PX_PER_MM),
          heightPx: Math.round(size.height * PX_PER_MM),
          svg: null
        }
      })
    )
    await nextTick()
    if (token !== loadToken) return
    observePages()
  } catch (err) {
    if (token !== loadToken) return
    if ((err as { name?: string })?.name === 'AbortError') return
    emit('error', err)
  } finally {
    if (token === loadToken) loading.value = false
  }
}

watch(() => props.file, load, { immediate: true })

onBeforeUnmount(() => {
  controller?.abort()
  teardownRender()
  pages.value = []
})
</script>
