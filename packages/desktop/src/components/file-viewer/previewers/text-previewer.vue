<template>
  <u-scroll tag="div" :class="cls.e('text')">
    <div v-if="truncated" :class="cls.e('sheet-note')">
      ⚠ 文件过大，仅展示前 {{ formatBytes(maxBytes) }}
    </div>
    <pre :class="cls.e('text-pre')"><code>{{ text }}</code></pre>
    <div v-if="loading" :class="cls.e('loading')">加载中…</div>
  </u-scroll>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'
import { UScroll } from '../../scroll'
import { formatBytes, toArrayBuffer } from '../helper'

defineOptions({ name: 'UFileViewerTextPreviewer' })

const { file, maxBytes = 2 * 1024 * 1024 } = defineProps<{
  file: FileViewerItem
  /** 单文件最大读取字节数（超出截断），默认 2MB */
  maxBytes?: number
}>()

const emit = defineEmits<{ (e: 'error', err: unknown): void }>()

const cls = bem('file-viewer')

const text = shallowRef('')
const truncated = ref(false)
const loading = ref(true)

let controller: AbortController | undefined

async function load() {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  truncated.value = false
  text.value = ''

  try {
    const buf = await toArrayBuffer(file.src, controller.signal)
    const max = maxBytes
    const view = max > 0 && buf.byteLength > max ? new Uint8Array(buf, 0, max) : new Uint8Array(buf)
    truncated.value = max > 0 && buf.byteLength > max
    text.value = new TextDecoder('utf-8', { fatal: false }).decode(view)
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return
    emit('error', err)
  } finally {
    loading.value = false
  }
}

// 只盯 src：宿主重算出的同内容新 file 对象不应触发重载
watch(
  () => file.src,
  () => load(),
  { immediate: true }
)

onBeforeUnmount(() => {
  controller?.abort()
  text.value = ''
})
</script>
