<template>
  <UImagePreviewer
    ref="previewer"
    :class="cls.e('image')"
    :src="file.src"
    :alt="file.name"
    :mime="file.mime"
    :modal="false"
    @zoom-change="onZoomChange"
    @error="onError"
  />
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { useTemplateRef } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'
import type { ImagePreviewerExposed } from '../../../types/image-previewer'
import UImagePreviewer from '../../image-previewer/image-previewer.vue'

defineOptions({ name: 'UFileViewerImagePreviewer' })

defineProps<{ file: FileViewerItem }>()

const emit = defineEmits<{
  (e: 'error', err: unknown): void
  (e: 'zoom-change', level: number): void
}>()

const cls = bem('file-viewer')

// 缩放命令转发给内嵌预览面，file-viewer 工具栏经本 expose 驱动
const previewer = useTemplateRef<ImagePreviewerExposed>('previewer')

function zoomIn() {
  previewer.value?.zoomIn()
}

function zoomOut() {
  previewer.value?.zoomOut()
}

function resetZoom() {
  previewer.value?.resetZoom()
}

function onZoomChange(level: number) {
  emit('zoom-change', level)
}

function onError(err: unknown) {
  emit('error', err)
}

defineExpose({ zoomIn, zoomOut, resetZoom })
</script>
