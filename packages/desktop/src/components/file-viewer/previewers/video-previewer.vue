<template>
  <div :class="cls.e('video')">
    <video
      v-if="url"
      ref="videoRef"
      :src="url"
      :type="file.mime"
      controls
      preload="metadata"
      playsinline
      @error="onVideoError"
    />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { onBeforeUnmount, shallowRef, useTemplateRef, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'

defineOptions({ name: 'FileViewerVideoPreviewer' })

const props = defineProps<{ file: FileViewerItem }>()

const emit = defineEmits<{ (e: 'error', err: unknown): void }>()

const cls = bem('file-viewer')

const url = shallowRef<string>('')
const videoRef = useTemplateRef<HTMLVideoElement>('videoRef')

let revoke: (() => void) | undefined
let unmounting = false

async function load() {
  revoke?.()
  const { toBlobUrl } = await import('../helper')
  const r = toBlobUrl(props.file.src, props.file.mime)
  url.value = r.url
  revoke = r.revoke
}

function onVideoError(e: Event) {
  if (unmounting) return
  const v = e.target as HTMLVideoElement | null
  if (!v?.src) return
  emit('error', e)
}

watch(
  () => props.file,
  () => load(),
  { immediate: true }
)

onBeforeUnmount(() => {
  unmounting = true
  const v = videoRef.value
  if (v) {
    v.pause()
    v.removeAttribute('src')
    try {
      v.load()
    } catch {
      /* noop */
    }
  }
  revoke?.()
  url.value = ''
})
</script>
