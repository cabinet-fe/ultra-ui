<template>
  <div :class="cls.e('pdf')" v-bind="attrs">
    <div v-if="!engine || isLoading" :class="cls.e('loading')">正在加载 PDF 引擎…</div>
    <EmbedPDF v-else-if="pdfUrl" :engine="engine" :plugins="plugins" v-slot="{ activeDocumentId }">
      <PdfZoomBridge
        v-if="activeDocumentId"
        :document-id="activeDocumentId"
        @zoom-change="onZoomChange"
      />
      <DocumentContent
        v-if="activeDocumentId"
        :document-id="activeDocumentId"
        v-slot="{ isLoaded }"
      >
        <Viewport v-if="isLoaded" :document-id="activeDocumentId" :class="cls.e('pdf-viewport')">
          <PdfViewportScroll>
            <ZoomGestureWrapper :document-id="activeDocumentId" :enable-wheel="true">
              <Scroller :document-id="activeDocumentId">
                <template #default="{ page }">
                  <div
                    :class="cls.e('pdf-page')"
                    :style="{ width: page.width + 'px', height: page.height + 'px' }"
                  >
                    <RenderLayer :document-id="activeDocumentId" :page-index="page.pageIndex" />
                  </div>
                </template>
              </Scroller>
            </ZoomGestureWrapper>
          </PdfViewportScroll>
        </Viewport>
      </DocumentContent>
    </EmbedPDF>
  </div>
</template>

<script lang="ts" setup>
import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/vue'
import { usePdfiumEngine } from '@embedpdf/engines/vue'
import {
  DocumentContent,
  DocumentManagerPluginPackage
} from '@embedpdf/plugin-document-manager/vue'
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/vue'
import { ScrollPluginPackage, Scroller } from '@embedpdf/plugin-scroll/vue'
import { ViewportPluginPackage, Viewport } from '@embedpdf/plugin-viewport/vue'
import {
  ZoomGestureWrapper,
  ZoomMode,
  ZoomPluginPackage,
  type ZoomScope
} from '@embedpdf/plugin-zoom/vue'
import { bem } from '@veltra/utils'
import { computed, onBeforeUnmount, shallowRef, useAttrs, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'
import { toBlobUrl } from '../helper'
import PdfViewportScroll from './pdf-viewport-scroll.vue'
import PdfZoomBridge from './pdf-zoom-bridge.vue'

defineOptions({ name: 'FileViewerPdfPreviewer', inheritAttrs: false })

const props = defineProps<{ file: FileViewerItem }>()

const emit = defineEmits<{
  (e: 'error', err: unknown): void
  (e: 'zoom-change', level: number): void
}>()

const cls = bem('file-viewer')
const attrs = useAttrs()

const { engine, isLoading, error } = usePdfiumEngine()

const pdfUrl = shallowRef<string>('')
let revoke: (() => void) | undefined

/** 当前文档的 zoom API（由 PdfZoomBridge 注入） */
let zoomScope: ZoomScope | null = null

function load() {
  revoke?.()
  const r = toBlobUrl(props.file.src, props.file.mime ?? 'application/pdf')
  pdfUrl.value = r.url
  revoke = r.revoke
}

const plugins = computed(() => {
  if (!pdfUrl.value) return []
  return [
    createPluginRegistration(DocumentManagerPluginPackage, {
      initialDocuments: [{ url: pdfUrl.value }]
    }),
    createPluginRegistration(ViewportPluginPackage, { viewportGap: 0 }),
    createPluginRegistration(ScrollPluginPackage, { defaultBufferSize: 2 }),
    createPluginRegistration(RenderPluginPackage),
    createPluginRegistration(ZoomPluginPackage, {
      defaultZoomLevel: ZoomMode.FitPage,
      minZoom: 0.5,
      maxZoom: 3,
      zoomStep: 0.1
    })
  ]
})

function onZoomChange(payload: { level: number; scope: ZoomScope | null }) {
  zoomScope = payload.scope
  emit('zoom-change', payload.level)
}

function zoomIn() {
  zoomScope?.zoomIn()
}

function zoomOut() {
  zoomScope?.zoomOut()
}

function resetZoom() {
  zoomScope?.requestZoom(ZoomMode.FitPage)
}

watch(
  () => props.file,
  () => load(),
  { immediate: true }
)

watch(error, (err) => {
  if (err) emit('error', err)
})

onBeforeUnmount(() => {
  revoke?.()
  pdfUrl.value = ''
  zoomScope = null
})

defineExpose({ zoomIn, zoomOut, resetZoom })
</script>
