<template>
  <div
    :class="[cls.b, bem.is('disabled', disabled)]"
    :style="`height: ${height}`"
    ref="editorRef"
  />
</template>

<script lang="ts" setup>
import type {
  TextEditorProps,
  TextEditorEmits
} from '@ui/types/components/text-editor'
import { bem } from '@ui/utils'
import Quill from 'quill'
import type { Delta, Op } from 'quill/core'
import { onMounted, onUnmounted, shallowRef } from 'vue'

defineOptions({
  name: 'TextEditor'
})

const emit = defineEmits<TextEditorEmits>()

const props = withDefaults(defineProps<TextEditorProps>(), {
  disabled: false,
  placeholder: '请输入'
})

const cls = bem('text-editor')

const data = defineModel<Delta | Op[]>({ required: true })

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

const createTextEditor = () => {

  quill = new Quill(editorRef.value, options)

  quill.on('text-change', update)
  quill.updateContents(data.value)
}

onMounted(() => {
  createTextEditor()
})

/** 调用富文本方法 */
const quillRef = () => {
  return quill
}

/** 赋值方法 */
const setValue = (value: Delta | Op[]) => {
  quill.update()
  return quill.updateContents(value)
}

/** 获取toolbar */
const getModelBar = () => {
  return quill.getModule('toolbar')
}

/** 更新data的值 */
const update = (delta: any) => {
  const contents = quill.getContents()

  data.value = contents.ops
}

onUnmounted(() => {
  quill.off('text-change', update)
})

defineExpose({ quillRef, setValue, getModelBar })
</script>
