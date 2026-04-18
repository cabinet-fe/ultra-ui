<template>
  <div :class="cls.e('pdf')">
    <div v-if="!engine || isLoading" :class="cls.e('loading')">正在加载 PDF 引擎…</div>
    <EmbedPDF v-else-if="pdfUrl" :engine="engine" :plugins="plugins" v-slot="{ activeDocumentId }">
      <DocumentContent
        v-if="activeDocumentId"
        :document-id="activeDocumentId"
        v-slot="{ isLoaded }"
      >
        <Viewport v-if="isLoaded" :document-id="activeDocumentId" :class="cls.e('pdf-viewport')">
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
import { bem } from '@veltra/utils'
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'

defineOptions({ name: 'FileViewerPdfPreviewer' })

const props = defineProps<{ file: FileViewerItem }>()

const emit = defineEmits<{ (e: 'error', err: unknown): void }>()

const cls = bem('file-viewer')

const { engine, isLoading, error } = usePdfiumEngine()

const pdfUrl = shallowRef<string>('')
let revoke: (() => void) | undefined

async function load() {
  revoke?.()
  const { toBlobUrl } = await import('../helper')
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
    createPluginRegistration(ViewportPluginPackage),
    createPluginRegistration(ScrollPluginPackage),
    createPluginRegistration(RenderPluginPackage)
  ]
})

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
})
</script>
