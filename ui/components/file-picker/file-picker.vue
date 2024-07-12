<template>
  <component :is="tag" :class="cls.b" @click="fileRef?.click()">
    <input
      :multiple="multiple"
      :class="cls.e('native')"
      type="file"
      :accept="accept"
      hidden
      placeholder="选择文件"
      ref="fileRef"
      @change="handleChange"
    />
    <slot />
  </component>
</template>

<script lang="ts" setup>
import type {
  UploaderProps,
  UploaderEmits
} from '@ui/types/components/file-picker'
import { bem } from '@ui/utils'
import { shallowRef } from 'vue'

defineOptions({
  name: 'FilePicker'
})

withDefaults(defineProps<UploaderProps>(), {
  tag: 'div',
  multiple: false
})

const emit = defineEmits<UploaderEmits>()

const cls = bem('file-picker')

const fileRef = shallowRef<HTMLInputElement>()

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('pick', Array.prototype.slice.call(target.files) as File[])
  target.value = ''
}
</script>
