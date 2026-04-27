<template>
  <u-scroll tag="div" :class="cls.e('docx')" v-bind="attrs">
    <div ref="container" :class="cls.e('docx-body')" />
    <div v-if="loading" :class="cls.e('loading')">加载中…</div>
  </u-scroll>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { onBeforeUnmount, ref, useAttrs, useTemplateRef, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'
import { UScroll } from '../../scroll'

defineOptions({ name: 'FileViewerDocxPreviewer', inheritAttrs: false })

const props = defineProps<{ file: FileViewerItem }>()

const emit = defineEmits<{ (e: 'error', err: unknown): void }>()

const cls = bem('file-viewer')
const attrs = useAttrs()

const container = useTemplateRef<HTMLDivElement>('container')
const loading = ref(true)

let controller: AbortController | undefined

async function load() {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  loading.value = true

  try {
    const [{ toArrayBuffer }, docx] = await Promise.all([
      import('../helper'),
      import('docx-preview')
    ])

    const buf = await toArrayBuffer(props.file.src, signal)
    if (signal.aborted) return
    const el = container.value
    if (!el) return
    el.innerHTML = ''

    await docx.renderAsync(buf, el, undefined, {
      className: 'u-file-viewer__docx-doc',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      experimental: false,
      useBase64URL: false,
      renderChanges: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true
    })
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return
    emit('error', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.file,
  () => load(),
  { immediate: true }
)

onBeforeUnmount(() => {
  controller?.abort()
  if (container.value) container.value.innerHTML = ''
})
</script>
