<template>
  <component :is="tag" :class="cls.b" @click.stop="handleClickPicker">
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
    <slot />
  </component>
</template>

<script lang="ts" setup>
import type { UploaderProps, UploaderEmits } from '@ui/types'
import { bem } from '@ui/utils'
import { shallowRef } from 'vue'
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

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.prototype.slice.call(target.files) as File[]
  const filteredFiles = files.filter(file => matchAccept(file, props.accept))

  emit('pick', filteredFiles)
  target.value = ''
}

function handleClickPicker() {
  if (props.disabled) return
  fileRef.value?.click()
}
</script>
