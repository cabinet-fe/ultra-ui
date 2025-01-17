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
import type { ExpressionEditorProps } from '@ui/types/components/expression-editor'
import { bem } from '@ui/utils'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  createEditor,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
  KEY_DOWN_COMMAND
} from 'lexical'
import { registerPlainText } from '@lexical/plain-text'
import { mergeRegister } from '@lexical/utils'
import { onMounted, useTemplateRef, watch, provide } from 'vue'
import { VariableNode } from './nodes/variable-node'
import { ExpressionEditorDIKey } from './di'
import VariablePicker from './components/variable-picker.vue'

defineOptions({
  name: 'ExpressionEditor'
})

const props = defineProps<ExpressionEditorProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const cls = bem('expression-editor')

const variablePickerRef = useTemplateRef('variable-picker')

const SHOW_VARIABLES = createCommand<KeyboardEvent>()

const editor = createEditor({
  namespace: 'ExpressionEditor',
  nodes: [],
  onError: error => {
    console.error(error)
  }
})

// 注册纯文本处理器
mergeRegister(
  registerPlainText(editor),
  // 注册键盘事件处理
  editor.registerCommand<KeyboardEvent>(
    SHOW_VARIABLES,
    event => {
      if (event.key === '/') {
        // 显示变量选择器
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const node = selection.anchor.getNode()
          if (node) {
            const domElement = editor.getElementByKey(node.getKey())
            if (domElement) {
              variablePickerRef.value?.open(domElement)
              return true
            }
          }
        }
      }
      return false
    },
    COMMAND_PRIORITY_NORMAL
  ),
  editor.registerCommand<KeyboardEvent>(
    KEY_DOWN_COMMAND,
    event => {
      return editor.dispatchCommand(SHOW_VARIABLES, event)
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
