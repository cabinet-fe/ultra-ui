<template>
  <div :class="cls.b">
    <VariablePicker ref="variable-picker" />
    <div
      :class="cls.e('container')"
      ref="container"
      contenteditable
      tabindex="0"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import type { ExpressionEditorProps } from '@ui/types'
import { bem } from '@ui/utils'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  createEditor,
  COMMAND_PRIORITY_NORMAL,
  SELECTION_CHANGE_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND
} from 'lexical'
import { registerPlainText } from '@lexical/plain-text'
import { mergeRegister } from '@lexical/utils'
import { onMounted, useTemplateRef, watch, provide } from 'vue'
import { ExpressionEditorDIKey } from './di'
import VariablePicker from './components/variable-picker.vue'
import { VariableNode } from './nodes/variable-node'

defineOptions({
  name: 'ExpressionEditor'
})

const props = defineProps<ExpressionEditorProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const cls = bem('expression-editor')

const variablePickerRef = useTemplateRef('variable-picker')

const editor = createEditor({
  namespace: 'ExpressionEditor',
  nodes: [VariableNode],
  onError: error => {
    console.error(error)
  }
})

// 注册纯文本处理器
mergeRegister(
  registerPlainText(editor),

  editor.registerCommand(
    SELECTION_CHANGE_COMMAND,
    () => {
      const selection = $getSelection()
      // 插入变量
      if ($isRangeSelection(selection)) {
        const node = selection.anchor.getNode()
        const char = node.getTextContent()[selection.anchor.offset - 1]
        if (char === '{') {
          const domElement = editor.getElementByKey(node.getKey())
          domElement && variablePickerRef.value?.open(domElement)
        } else {
          variablePickerRef.value?.close()
        }
        return true
      }
      return false
    },
    COMMAND_PRIORITY_NORMAL
  ),
  editor.registerCommand(
    KEY_ARROW_DOWN_COMMAND,
    (e: KeyboardEvent) => {
      e.preventDefault()
      return true
    },
    COMMAND_PRIORITY_NORMAL
  ),
  editor.registerCommand(
    KEY_ARROW_UP_COMMAND,
    (e: KeyboardEvent) => {
      e.preventDefault()
      return true
    },
    COMMAND_PRIORITY_NORMAL
  )
)

editor.registerUpdateListener(({ editorState }) => {
  const text = editorState.read(() => $getRoot().getTextContent())
  emit('update:modelValue', text)
})

const editorContainer = useTemplateRef('container')

watch(
  () => props.modelValue,
  newValue => {
    if (newValue === undefined) return

    editor.update(() => {
      const root = $getRoot()
      if (root.getTextContent() !== newValue) {
        root.clear()
        const paragraph = $createParagraphNode()
        const textNode = $createTextNode(newValue)
        paragraph.append(textNode)
        root.append(paragraph)
      }
    })
  },
  { immediate: true }
)

onMounted(() => {
  editor.setRootElement(editorContainer.value)

  if (!props.modelValue) {
    editor.update(() => {
      const paragraph = $createParagraphNode()
      const textNode = $createTextNode('')
      paragraph.append(textNode)
      $getRoot().append(paragraph)
    })
  }
})

provide(ExpressionEditorDIKey, {
  cls,
  editor,
  editorProps: props
})
</script>
