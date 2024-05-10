<template>
  <div :class="className" :style="`height: ${height}`" ref="editorRef" />
</template>

<script lang="ts" setup>
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import type {
  TextEditorProps,
  TextEditorEmits
} from '@ui/types/components/text-editor'
import { bem } from '@ui/utils'
import Quill from 'quill'
import type { Delta, Op } from 'quill/core'
import {
  onMounted,
  onUnmounted,
  shallowRef,
  ref,
  watch,
  computed,
  nextTick
} from 'vue'

defineOptions({
  name: 'TextEditor'
})

const emit = defineEmits<TextEditorEmits>()

const props = withDefaults(defineProps<TextEditorProps>(), {
  disabled: undefined,
  placeholder: '请输入'
})

const { formProps } = useFormComponent()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props])

/** 类名 */
const className = computed(() => {
  return [cls.b, cls.m(size.value), bem.is('disabled', disabled.value)]
})

const cls = bem('text-editor')

const editorRef = shallowRef<HTMLElement>()

const options = {
  modules: {
    toolbar: props.toolbar ?? [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['link'],
      ['bold', 'italic', 'underline'],
      ['image', 'code-block']
    ]
  },
  // readOnly: disabled.value,
  scrollingContainer: true,
  theme: 'snow'
}

let quill: Quill | null = null

const stamp = ref<string>('')

const createTextEditor = async () => {
  if (quill) {
    const theme: any = quill?.theme
    // remove toolbox
    theme.modules?.toolbar?.container?.remove()
    // remove clipboard
    theme.modules?.clipboard?.container?.remove()
  }

  // quill = null
  await nextTick()
  quill = new Quill(editorRef.value!, options)

  quill.on('text-change', update)

  if (props.modelValue) {
    quill.updateContents(props.modelValue)
  }
  // 双向绑定标志
  stamp.value = `${new Date().getTime()}${Math.random()}`
}

onMounted(() => {
  createTextEditor()
})

watch(
  () => disabled.value,
  () => {
    createTextEditor()
    // quill?.enable(disabled.value)
  }
)

/** 调用富文本方法 */
const quillRef = () => {
  return quill
}

/** 赋值方法 */
const setValue = (value: Delta | Op[]) => {
  quill?.update()
  return quill?.updateContents(value)
}

/** 获取toolbar */
const getModelBar = () => {
  return quill?.getModule('toolbar')
}

/** 更新data的值 */
const update = (_, __, ___: 'user' | 'api') => {
  const contents = quill?.getContents()

  emit('update:modelValue', { value: contents, stamp: stamp.value })
}

onUnmounted(() => {
  quill?.off('text-change', update)
  quill?.history.clear()
})

watch([() => props.modelValue, () => quill], ([val, qui]) => {
  if (qui && val?.['stamp'] !== stamp.value) {
    qui.setContents(val?.['value'])
  }
})

defineExpose({ quillRef, setValue, getModelBar })
</script>
