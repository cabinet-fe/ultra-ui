<template>
  <div :class="className">
    <div
      ref="container"
      :class="cls.e('container')"
      :contenteditable="!readonly && !disabled"
      :data-empty="isEmpty || undefined"
      :data-placeholder="props.placeholder"
      @keydown="onKeydown"
      @blur="onBlur"
    ></div>

    <div v-if="showPlaceholder" :class="cls.e('placeholder')">
      {{ props.placeholder }}
    </div>

    <VariablePicker
      ref="pickerRef"
      :visible="pickerVisible"
      :trigger-dom="pickerTriggerDom"
      :variables="props.variables"
      :filter="pickerFilter"
      :selectable-levels="props.selectableLevels ?? 'leaf'"
      @select="onPickerSelect"
      @dismiss="onPickerDismiss"
      @update:visible="onPickerVisibleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
  watch
} from 'vue'

import type { ExpressionEditorProps, VariableItem } from '../../types'
import VariablePicker from './components/variable-picker.vue'
import { createEditor, type EditorAPI } from './core/editor'
import { createMention, type MentionAPI } from './core/mention'
import { parse, type Doc } from './core/model'
import { createVariableMap } from './di'

defineOptions({ name: 'UExpressionEditor' })

const props = withDefaults(defineProps<ExpressionEditorProps>(), {
  placeholder: '请输入表达式，输入 @ 可插入变量',
  selectableLevels: 'leaf'
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const cls = bem('expression-editor')
const { formProps } = injectFormContext()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const containerRef = useTemplateRef<HTMLDivElement>('container')
const pickerRef = useTemplateRef<{ handleKeydown: (e: KeyboardEvent) => boolean }>('pickerRef')

const className = computed(() => [
  cls.b,
  cls.m(size.value),
  bem.is('disabled', disabled.value),
  bem.is('readonly', readonly.value)
])

const variableMap = computed(() => createVariableMap(props.variables))

const editorRef = shallowRef<EditorAPI | null>(null)
const mention: MentionAPI = createMention()

const currentDoc = shallowRef<Doc>([])
const isEmpty = computed(() => currentDoc.value.length === 0)
const showPlaceholder = computed(() => isEmpty.value && !disabled.value)

const pickerMode = shallowRef<'mention' | 'reselect' | null>(null)
const pickerTriggerDom = shallowRef<HTMLElement | undefined>(undefined)
const reselectingSegIdx = shallowRef<number | null>(null)
const pickerFilter = shallowRef('')

const pickerVisible = computed(() => pickerMode.value !== null)

function syncMention() {
  const editor = editorRef.value
  if (!editor) return
  if (pickerMode.value === 'reselect') return
  const caret = editor.getCaretOffset()
  const state = mention.update(currentDoc.value, caret)
  if (state) {
    pickerMode.value = 'mention'
    pickerFilter.value = state.filter
    pickerTriggerDom.value = containerRef.value ?? undefined
  } else if (pickerMode.value === 'mention') {
    closePicker()
  }
}

function closePicker() {
  pickerMode.value = null
  reselectingSegIdx.value = null
  pickerFilter.value = ''
}

onMounted(() => {
  if (!containerRef.value) return
  const initialDoc = parse(props.modelValue ?? '', variableMap.value)
  currentDoc.value = initialDoc

  const editor = createEditor({
    container: containerRef.value,
    cls,
    initialDoc,
    getVariableMap: () => variableMap.value,
    onChange: (doc) => {
      currentDoc.value = doc
      const value = serializeFromDoc(doc)
      if (value !== (props.modelValue ?? '')) emit('update:modelValue', value)
      syncMention()
    },
    onSelectionChange: () => {
      syncMention()
    },
    onChipReselect: ({ chipEl, segIndex }) => {
      if (disabled.value || readonly.value) return
      mention.commit()
      pickerMode.value = 'reselect'
      pickerFilter.value = ''
      pickerTriggerDom.value = chipEl
      reselectingSegIdx.value = segIndex
    },
    onChipRemove: ({ segIndex }) => {
      if (disabled.value || readonly.value) return
      editor.removeVarAt(segIndex)
    }
  })
  editorRef.value = editor
})

onBeforeUnmount(() => {
  editorRef.value?.dispose()
})

function serializeFromDoc(doc: Doc): string {
  let s = ''
  for (const seg of doc) s += seg.kind === 'text' ? seg.value : `{${seg.value}}`
  return s
}

watch(
  () => props.modelValue,
  (v) => {
    const editor = editorRef.value
    if (!editor) return
    if (v === editor.getValue()) return
    editor.setValue(v ?? '')
  }
)

watch(variableMap, () => {
  // variables 变化：重渲染以刷新 chip label / type
  const editor = editorRef.value
  if (!editor) return
  editor.setValue(editor.getValue())
})

function onKeydown(e: KeyboardEvent) {
  if (disabled.value || readonly.value) return
  // mention / reselect 激活时，优先把箭头键 / Enter / Esc 转给 picker
  if (pickerMode.value !== null) {
    const handledByPicker = pickerRef.value?.handleKeydown(e)
    if (handledByPicker) {
      e.preventDefault()
      return
    }
  }

  if (pickerMode.value === 'mention') {
    // 这些键导致 mention 退出（保留 @filter 文本，光标继续移动）
    if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      mention.dismiss()
      closePicker()
    }
  }
}

function onBlur() {
  if (pickerMode.value === 'mention') {
    mention.dismiss()
    // 下一帧再关闭，避免和 picker 内 click 冲突
    void nextTick(() => closePicker())
  }
}

function onPickerSelect(item: VariableItem) {
  const editor = editorRef.value
  if (!editor) return

  if (pickerMode.value === 'mention') {
    const state = mention.getState()
    if (!state) return
    const anchor = state.anchorOffset
    const caret = editor.getCaretOffset() ?? anchor + state.filter.length + 1
    editor.replaceRangeWithVar(anchor, caret, {
      value: item.value,
      label: item.label,
      ...(item.type ? { type: item.type } : {})
    })
    mention.commit()
  } else if (pickerMode.value === 'reselect') {
    const idx = reselectingSegIdx.value
    if (idx !== null) {
      editor.replaceVarAt(idx, {
        value: item.value,
        label: item.label,
        ...(item.type ? { type: item.type } : {})
      })
    }
  }
  closePicker()
}

function onPickerDismiss() {
  if (pickerMode.value === 'mention') mention.dismiss()
  closePicker()
}

function onPickerVisibleChange(v: boolean) {
  if (!v && pickerMode.value !== null) {
    if (pickerMode.value === 'mention') mention.dismiss()
    closePicker()
  }
}
</script>
