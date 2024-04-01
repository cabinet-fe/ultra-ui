<template>
  <div :class="cls.b" @click="fileRef?.click()">
    <input
      :multiple="multiple"
      type="file"
      :accept="accept"
      hidden
      ref="fileRef"
      @change="handleChange"
    />

    <slot />
  </div>
</template>

<script lang="ts" setup generic="M extends boolean">
import type {
  UploaderProps,
  UploaderEmits
} from '@ui/types/components/file-picker'
import { bem } from '@ui/utils'
import { shallowRef } from 'vue'

defineOptions({
  name: 'FilePicker'
})

const props = defineProps<UploaderProps<M>>()

const emit = defineEmits<UploaderEmits<M>>()

const cls = bem('file-picker')

const fileRef = shallowRef<HTMLInputElement>()

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement

  emit(
    'pick',
    props.multiple ? Array.prototype.slice.call(target.files) : target.files[0]!
  )

  target.value = ''
}
</script>
