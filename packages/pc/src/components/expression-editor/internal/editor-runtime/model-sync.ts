import {
  $createParagraphNode,
  $getRoot,
  SKIP_DOM_SELECTION_TAG,
  type LexicalEditor
} from 'lexical'
import { nextTick, watchEffect, type ComputedRef } from 'vue'
import { parseContent } from '../../parser'
import type {
  ExpressionEditorEmits,
  ExpressionEditorProps,
  VariableItem
} from '@ui/types'

interface CreateModelSyncOptions {
  editor: LexicalEditor
  props: ExpressionEditorProps
  emit: ExpressionEditorEmits
  variableMap: ComputedRef<Map<string, VariableItem>>
}

export function createModelSync(options: CreateModelSyncOptions) {
  const { editor, props, emit, variableMap } = options

  let changeByUser = false
  let changeByModel = false
  let lastEmittedValue: string | null = null

  function syncFromModelValue() {
    changeByModel = true
    const { modelValue } = props
    if (!modelValue) return

    editor.update(
      () => {
        const root = $getRoot()
        root.clear()
        const paragraph = $createParagraphNode()
        const nodes = parseContent(modelValue, variableMap.value)
        paragraph.append(...nodes)
        root.append(paragraph)
      },
      { tag: SKIP_DOM_SELECTION_TAG }
    )

    nextTick(() => {
      changeByModel = false
    })
  }

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
    if (changeByUser) return
    const current = editor.getEditorState().read(() => $getRoot().getTextContent())
    if (props.modelValue === current) return
    syncFromModelValue()
  })

  return {
    syncFromModelValue
  }
}
