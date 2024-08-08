<template>
  <div :class="className">
    <Bar ref="barRef" />

    <div :class="cls.e('hover')" :style="`height: ${height}`" ref="editorRef" />
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
import type { Delta, QuillOptions, Op } from 'quill/core'
import {
  onMounted,
  shallowRef,
  ref,
  watch,
  computed,
  nextTick,
  onBeforeUnmount,
  provide
} from 'vue'
import Bar from './bar.vue'
import { TextEditorDIKey } from './di'

defineOptions({
  name: 'TextEditor'
})

const emit = defineEmits<TextEditorEmits>()

const props = withDefaults(defineProps<TextEditorProps>(), {
  disabled: undefined,
  toolbar: undefined,
  placeholder: '请输入'
})

provide(TextEditorDIKey, {
  textEditorProps: props
})

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

const cls = bem('text-editor')

const editorRef = shallowRef<HTMLElement>()

const barRef = shallowRef<InstanceType<typeof Bar>>()

let options: QuillOptions

let quill: Quill | null = null

const stamp = ref<string>('')

const getOptions = () => {
  options = {
    modules: {
      toolbar: barRef.value?.barRef
    },
    // readOnly: readonly.value,
    theme: 'snow',
    placeholder:
      disabled.value || readonly.value ? undefined : props.placeholder
  }
}

/** 因为没有所以设定一个重新渲染的变量 */
let reRendering = ref(true)

/** 等待barRef加载出来 */
nextTick(() => {
  getOptions()
})

/** 创建textEditor实例 */
const createTextEditor = async () => {
  destroy()
  await nextTick()
  reRendering.value = true

  nextTick(() => {
    console.log(options, 'options')
    quill = new Quill(editorRef.value!, options)

    quill.on('text-change', update)

    /** 禁用 */
    if (disabled.value || readonly.value) {
      quill.enable(false)
    } else {
      quill.enable(true)
    }

    quill.updateContents(props.modelValue!)

    // 双向绑定标志
    stamp.value = `${new Date().getTime()}${Math.random()}`
  })
}

/** 销毁quill实例 */
const destroy = () => {
  if (quill) {
    // const theme: any = quill?.theme

    // theme.modules?.toolbar?.container?.remove()

    // theme.modules?.clipboard?.container?.remove()

    reRendering.value = false
  }
}

onMounted(() => {
  createTextEditor()
})

watch(
  () => [disabled.value, readonly.value],
  () => {
    createTextEditor()
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

onBeforeUnmount(() => {
  quill?.off('text-change', update)
  quill?.history.clear()
  destroy()
})

watch([() => props.modelValue, () => quill], ([val, qui]) => {
  if (qui && val?.['stamp'] !== stamp.value) {
    qui.setContents(val?.['value'])
  }
})

defineExpose({ quillRef, setValue, getModelBar })
</script>
