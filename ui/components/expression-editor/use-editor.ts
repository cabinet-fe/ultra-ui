import {
  $createParagraphNode,
  $getRoot,
  createEditor,
  TextNode,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ARROW_DOWN_COMMAND
} from 'lexical'
import { VariableNode } from './nodes/variable-node'
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
    editable: getEditable(),
    theme: {
      variableNode: 'variable-tag'
    }
  })

  mergeRegister(registerPlainText(editor))

  mergeRegister(
    editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      () => {
        return false
      },
      0
    ),
    editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      () => {
        return false
      },
      0
    ),
    editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      () => {
        return false
      },
      0
    ),
    editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      () => {
        return false
      },
      0
    )
  )

  watchEffect(() => {
    editor.setEditable(getEditable())
  })

  watchEffect(() => {
    if (container.value) {
      editor.setRootElement(container.value)
    }
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
