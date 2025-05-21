import { $createParagraphNode, $getRoot, createEditor } from 'lexical'
import { VariableNode } from './nodes/variable-node'
import { registerPlainText } from './plain-text'
import { nextTick, watchEffect, type Ref, type ShallowRef } from 'vue'
import { parseContent } from './parser'
import type { ExpressionEditorEmits, ExpressionEditorProps } from '@ui/types'
import type { BEM } from '@ui/utils'
import { useContext } from './use-context'

interface EditorOptions {
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  props: ExpressionEditorProps
  cls: BEM<'expression-editor'>
  emit: ExpressionEditorEmits
  container: ShallowRef<HTMLElement | null>
}

export function useEditor(options: EditorOptions) {
  const { disabled, readonly, container, props, emit, cls } = options

  function getEditable() {
    return !disabled.value && !readonly.value
  }

  const editor = createEditor({
    namespace: 'ExpressionEditor',
    nodes: [VariableNode],
    onError: console.error,
    editable: getEditable(),
    theme: {
      paragraph: cls.e('paragraph')
    }
  })

  useContext(editor)

  registerPlainText(editor)

  let changeByUser = false
  let changeByModel = false

  editor.registerTextContentListener(text => {
    if (changeByModel) return

    emit('update:modelValue', text)
    changeByUser = true
    nextTick(() => {
      changeByUser = false
    })
  })

  watchEffect(() => {
    editor.setEditable(getEditable())
  })

  watchEffect(() => {
    container.value && editor.setRootElement(container.value)
  })

  function renderModelValue() {
    changeByModel = true
    const { modelValue } = props
    if (!modelValue) return

    editor.update(() => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      const nodes = parseContent(modelValue)
      paragraph.append(...nodes)
      root.append(paragraph)

      nextTick(() => {
        changeByModel = false
      })
    })
  }

  watchEffect(() => {
    if (changeByUser) return
    renderModelValue()
  })

  return editor
}
