<template>
  <span hidden aria-hidden="true" />
</template>

<script lang="ts" setup>
import { useZoom, ZoomMode, type ZoomScope } from '@embedpdf/plugin-zoom/vue'
import { watch } from 'vue'

defineOptions({ name: 'UFileViewerPdfZoomBridge' })

const props = defineProps<{ documentId: string }>()

const emit = defineEmits<{
  (e: 'zoom-change', payload: { level: number; scope: ZoomScope | null }): void
}>()

const { provides: zoom, state } = useZoom(() => props.documentId)

watch(
  [zoom, () => state.value.currentZoomLevel],
  () => {
    emit('zoom-change', { level: state.value.currentZoomLevel, scope: zoom.value })
  },
  { immediate: true }
)

defineExpose({ resetZoom: () => zoom.value?.requestZoom(ZoomMode.FitPage) })
</script>
