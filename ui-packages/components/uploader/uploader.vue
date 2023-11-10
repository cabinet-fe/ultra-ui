<template>
  <div :class="cls.b">
    <input type="file" :accept="accept" hidden ref="fileRef" />

    <slot />

    <UNodeRender :content="renderPicker()" />
  </div>
</template>

<script lang="ts" setup>
import type { UploaderProps } from '@ui/types/components/uploader'
import { bem } from '@ui/utils'
import { shallowRef, useSlots } from 'vue'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'Uploader'
})

defineProps<UploaderProps>()

const cls = bem('uploader')

const fileRef = shallowRef<HTMLInputElement>()

const slots = useSlots()
const renderPicker = () => {
  const pickerNodes = slots.picker?.() || []
  if (!pickerNodes.length) return null
  if (pickerNodes.length > 1) {
    console.warn('Uploader组件的picker插槽只能渲染一个元素， 多出的将被省略！')
  }
  const node = pickerNodes[0]!
  console.log(node)
  return node
}
</script>
