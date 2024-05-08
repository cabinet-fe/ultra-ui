<template>
  <div
    :class="[cls.b, bem.is('disabled', disabled)]"
    :style="`height: ${height}`"
    ref="editorRef"
  />
</template>

<script lang="ts" setup>
import type { TextEditorProps, TextEditorEmits } from '@ui/types/components/text-editor'
import { bem } from '@ui/utils'
import Quill from 'quill'
import { Delta, Op } from 'quill/core'
import { onMounted, onUnmounted, shallowRef, watch, ref } from 'vue'

defineOptions({
  name: 'TextEditor'
})

const emit = defineEmits<TextEditorEmits>()

const props = withDefaults(defineProps<TextEditorProps>(), {
  disabled: false,
  placeholder: '请输入'
})

const cls = bem('text-editor')

// const data = defineModel<Delta | Op[]>({ required: true })
// const data = ref<any>([])

const editorRef = shallowRef()

const options = {
  modules: {
    toolbar: props.toolbar ?? [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['link'],
      ['bold', 'italic', 'underline'],
      ['image', 'code-block']
    ]
  },
  readOnly: props.disabled,
  scrollingContainer: true,
  theme: 'snow'
}

let quill: Quill

const stamp = ref<string>('')

onMounted(() => {
  quill = new Quill(editorRef.value, options)

  quill.on('text-change', update)

  quill.updateContents(props.modelValue)

  stamp.value = `${new Date().getTime()}${Math.random()}`
})

/** 调用富文本 */
const quillRef = () => {
  return quill
}

/** 更新data的值 */
const update = (delta: any, oldDelta, source) => {
  console.log(delta, oldDelta, source)
  const contents = quill.getContents()

  // data.value = contents.ops
  if (source === 'user') emit('update:modelValue', { value: contents, stamp: stamp.value })
}

// onUnmounted(() => {
//   quill.off('text-change', update)
// })

watch(
  [() => props.modelValue, () => quill],
  ([val, qui]) => {
    if (qui && val.stamp !== stamp.value) qui.setContents(val.value)
  }
)

defineExpose({ quillRef })
</script>
