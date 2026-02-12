import {
  $createParagraphNode,
  $getRoot,
  createEditor,
  type LexicalEditor
} from 'lexical'
import { VariableNode } from './nodes/variable-node'
import { registerPlainText } from './plain-text'
import { nextTick, watchEffect, type Ref, type ShallowRef } from 'vue'
import { parseContent } from './parser'
import type { ExpressionEditorEmits, ExpressionEditorProps } from '@ui/types'
import type { BEM } from '@ui/utils'
import { createVariableMap } from './di'
import { computed } from 'vue'

interface EditorOptions {
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  props: ExpressionEditorProps
  cls: BEM<'expression-editor'>
  emit: ExpressionEditorEmits
  container: ShallowRef<HTMLElement | null>
}

export function useEditor(options: EditorOptions): LexicalEditor {
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

  registerPlainText(editor)

  let changeByUser = false
  let changeByModel = false
  let lastEmittedValue: string | null = null

  editor.registerTextContentListener(text => {
    if (changeByModel) return

    emit('update:modelValue', text)
    lastEmittedValue = text
    changeByUser = true
    nextTick(() => {
      if (lastEmittedValue === props.modelValue) {
        changeByUser = false
      } else {
        setTimeout(() => {
          changeByUser = false
        }, 0)
      }
    })
  })

  watchEffect(() => {
    editor.setEditable(getEditable())
  })

  watchEffect(() => {
    container.value && editor.setRootElement(container.value)
  })

  // 创建变量映射表
  const variableMap = computed(() => createVariableMap(props.variables))

  function renderModelValue() {
    changeByModel = true
    const { modelValue } = props
    if (!modelValue) return

    editor.update(() => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      const nodes = parseContent(modelValue, variableMap.value)
      paragraph.append(...nodes)
      root.append(paragraph)

      nextTick(() => {
        changeByModel = false
      })
    })
  }

  watchEffect(() => {
    if (changeByUser) return
    const current = editor.getEditorState().read(() => $getRoot().getTextContent())
    if (props.modelValue === current) return
    renderModelValue()
  })

  return editor
}
