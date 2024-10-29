<template>
  <div :class="className">
    <div :class="cls.e('bar')" ref="barContainerRef" v-if="!readonly">
      <select class="ql-size">
        <option value="small">小</option>
        <option selected>正常</option>
        <option value="large">大</option>
      </select>

      <UTip :content="item.content" v-for="item of toolbar" :key="item.bar">
        <button :class="`ql-${item.bar}`" />
      </UTip>
    </div>

    <div :class="cls.e('hover')" ref="containerRef" />
  </div>
</template>

<script lang="ts" setup>
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import type {
  TextEditorProps,
  TextEditorEmits
} from '@ui/types/components/text-editor'
import { bem } from '@ui/utils'
import Quill from 'quill'
import {
  shallowRef,
  computed,
  onBeforeUnmount,
  provide,
  watchEffect,
  nextTick,
  watch
} from 'vue'
import { TextEditorDIKey } from './di'

defineOptions({
  name: 'TextEditor'
})

const emit = defineEmits<TextEditorEmits>()

const props = withDefaults(defineProps<TextEditorProps>(), {
  disabled: undefined,
  placeholder: '请输入',
  toolbar: () => [
    { content: '加粗', bar: 'bold' },
    { content: '斜体', bar: 'italic' },
    { content: '下划线', bar: 'underline' },
    { content: '上传图片', bar: 'image' },
    { content: '插入链接', bar: 'link' },
    { content: '代码块', bar: 'code-block' },
    { content: '清除格式', bar: 'clean' }
  ]
})

const cls = bem('text-editor')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props
])

/** 类名 */
const className = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('readonly', readonly.value)
  ]
})

/** 容器 */
const containerRef = shallowRef<HTMLElement>()
/** 工具栏容器 */
const barContainerRef = shallowRef<HTMLElement>()

provide(TextEditorDIKey, {
  textEditorProps: props,
  barContainerRef
})

let quill = shallowRef<Quill>()

function resetQuill() {
  quill.value?.history.clear()
  quill.value?.off(Quill.events.TEXT_CHANGE)
  quill.value = undefined
}

let isUserInput = false
let isModelValueChange = false

function createQuill() {
  if (!containerRef.value) return
  resetQuill()

  const _quill = new Quill(containerRef.value, {
    modules: {
      toolbar: readonly.value ? false : barContainerRef.value
    },

    theme: 'snow',
    readOnly: readonly.value ?? disabled.value,

    placeholder:
      disabled.value || readonly.value ? undefined : props.placeholder
  })

  _quill.on(Quill.events.TEXT_CHANGE, () => {
    if (isModelValueChange) return
    isUserInput = true
    emit('update:modelValue', _quill.root.innerHTML)
    nextTick(() => {
      isUserInput = false
    })
  })

  quill.value = _quill
}

watchEffect(() => {
  createQuill()
})

watch(
  [() => props.modelValue, quill],
  ([modelValue, quill]) => {
    if (!quill || isUserInput) return
    isModelValueChange = true
    quill.root.innerHTML = modelValue ?? ''
    nextTick(() => {
      isModelValueChange = false
    })
  },
  { immediate: true }
)

watchEffect(() => {
  if (!quill.value) return

  if (disabled.value || readonly.value) {
    quill.value.enable(false)
  } else {
    quill.value.enable(true)
  }
})

onBeforeUnmount(() => {
  resetQuill()
})
</script>
