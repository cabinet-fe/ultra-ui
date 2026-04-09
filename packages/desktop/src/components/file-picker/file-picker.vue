<template>
  <component
    :is="tag"
    :class="cls.b"
    @click.stop="handleClickPicker"
    @dragover.prevent="handleDragover"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <input
      :multiple="multiple"
      :class="cls.e('native')"
      type="file"
      :accept="accept"
      hidden
      placeholder="选择文件"
      ref="fileRef"
      @change="handleChange"
      capture="environment"
    />
    <slot :is-dragover="isDragover" />
  </component>
</template>

<script lang="ts" setup>
import type { UploaderProps, UploaderEmits } from '../../types'
import { bem } from '@ultra-ui/utils'
import { shallowRef, ref } from 'vue'
import { matchAccept } from './helper'

defineOptions({
  name: 'FilePicker'
})

const props = withDefaults(defineProps<UploaderProps>(), {
  tag: 'div',
  multiple: false
})

const emit = defineEmits<UploaderEmits>()

const cls = bem('file-picker')

const fileRef = shallowRef<HTMLInputElement>()
const isDragover = ref(false)

const processFiles = (files: File[]) => {
  const filteredFiles = files.filter(file => matchAccept(file, props.accept))
  emit('pick', filteredFiles)
}

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  processFiles(files)
  target.value = ''
}

const handleDragover = (e: DragEvent) => {
  if (props.disabled) return
  isDragover.value = true
}

const handleDragLeave = (e: DragEvent) => {
  if (props.disabled) return
  const currentTarget = e.currentTarget as HTMLElement
  const relatedTarget = e.relatedTarget as HTMLElement | null

  if (currentTarget.contains(relatedTarget)) return
  isDragover.value = false
}

const handleDrop = (e: DragEvent) => {
  if (props.disabled) return
  isDragover.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  processFiles(files)
}

function handleClickPicker() {
  if (props.disabled) return
  fileRef.value?.click()
}
</script>
