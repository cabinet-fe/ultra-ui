<template>
  <div :class="[cls.e('image'), bem.is('actual', actual)]">
    <img
      v-if="url"
      :src="url"
      :alt="file.name"
      draggable="false"
      @load="loading = false"
      @error="onImgError"
      @dblclick="actual = !actual"
    />
    <div v-if="loading" :class="cls.e('loading')">加载中…</div>
    <div v-if="failed" :class="cls.e('loading')">图片加载失败</div>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import type { FileViewerItem } from '../../../types/file-viewer'

defineOptions({ name: 'FileViewerImagePreviewer' })

const props = defineProps<{ file: FileViewerItem }>()

const emit = defineEmits<{ (e: 'error', err: unknown): void }>()

const cls = bem('file-viewer')

const url = shallowRef<string>('')
const loading = ref(true)
const failed = ref(false)
const actual = ref(false)

let revoke: (() => void) | undefined

async function load() {
  loading.value = true
  failed.value = false
  revoke?.()
  const { toBlobUrl } = await import('../helper')
  const r = toBlobUrl(props.file.src, props.file.mime)
  url.value = r.url
  revoke = r.revoke
}

function onImgError(e: Event) {
  loading.value = false
  failed.value = true
  emit('error', e)
}

watch(
  () => props.file,
  () => load(),
  { immediate: true }
)

onBeforeUnmount(() => {
  revoke?.()
  url.value = ''
})
</script>
