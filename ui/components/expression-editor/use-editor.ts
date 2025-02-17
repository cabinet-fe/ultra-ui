import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $setSelection,
  COMMAND_PRIORITY_NORMAL,
  createEditor,
  SELECTION_CHANGE_COMMAND,
  TextNode
} from 'lexical'
import { $createVariableNode, VariableNode } from './nodes/variable-node'
import { registerPlainText } from '@lexical/plain-text'
import { mergeRegister } from '@lexical/utils'
import { watchEffect, type Ref, type ShallowRef } from 'vue'
import { parseContent } from './parser'
import type { ExpressionEditorEmits, ExpressionEditorProps } from '@ui/types'

interface EditorOptions {
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  props: ExpressionEditorProps
  emit: ExpressionEditorEmits
  container: ShallowRef<HTMLElement | null>
}

export function useEditor(options: EditorOptions) {
  const { disabled, readonly, container, props, emit } = options

  function getEditable() {
    return !disabled.value && !readonly.value
  }

  const editor = createEditor({
    namespace: 'UExpressionEditor',
    nodes: [VariableNode],
    onError: console.error,
    editable: getEditable()
  })

  mergeRegister(
    registerPlainText(editor),

    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection()
        if ($isNodeSelection(selection)) {
          console.log(selection)
        }

        return true
      },
      COMMAND_PRIORITY_NORMAL
    )
  )

  watchEffect(() => {
    editor.setEditable(getEditable())
  })

  watchEffect(() => {
    container.value && editor.setRootElement(container.value)
  })

  editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => {
      emit('update:modelValue', $getRoot().getTextContent())
    })
  })

  editor.registerNodeTransform(TextNode, node => {
    if (/\{([^}]+)\}/.test(node.__text)) {
      console.log(node.__text)
    }
  })

  watchEffect(() => {
    const { modelValue } = props
    const currentContent = editor
      .getEditorState()
      .read(() => $getRoot().getTextContent())

    if (!modelValue || currentContent === modelValue) return

    editor.update(() => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      const nodes = parseContent(modelValue)
      paragraph.append(...nodes)
      root.append(paragraph)
    })
  })

  return editor
}
