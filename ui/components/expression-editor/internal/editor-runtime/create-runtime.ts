import { createEditor } from 'lexical'
import { watchEffect, computed, type Ref, type ShallowRef } from 'vue'
import type { ExpressionEditorEmits, ExpressionEditorProps } from '@ui/types'
import type { BEM } from '@ui/utils'
import type {
  EditorMutationGateway,
  ExpressionEditorRuntime
} from '../contracts/editor-runtime'
import { VariableNode } from '../../nodes/variable-node'
import { createVariableMap } from '../../di'
import { createModelSync } from './model-sync'

export interface CreateExpressionEditorRuntimeOptions {
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  props: ExpressionEditorProps
  cls: BEM<'expression-editor'>
  emit: ExpressionEditorEmits
  container: ShallowRef<HTMLElement | null>
}

function createDefaultMutationGateway(
  editor: ExpressionEditorRuntime['editor']
): EditorMutationGateway {
  return {
    runUpdate(updater) {
      editor.update(() => {
        updater()
      })
    }
  }
}

function resolveEditable(disabled: Ref<boolean>, readonly: Ref<boolean>) {
  return !disabled.value && !readonly.value
}

export function createExpressionEditorRuntime(
  options: CreateExpressionEditorRuntimeOptions
): ExpressionEditorRuntime {
  const { disabled, readonly, container, props, emit, cls } = options
  const editor = createEditor({
    namespace: 'ExpressionEditor',
    nodes: [VariableNode],
    onError: console.error,
    editable: resolveEditable(disabled, readonly),
    theme: {
      paragraph: cls.e('paragraph')
    }
  })

  watchEffect(() => {
    editor.setEditable(resolveEditable(disabled, readonly))
  })

  watchEffect(() => {
    container.value && editor.setRootElement(container.value)
  })

  const variableMap = computed(() => createVariableMap(props.variables))
  const sync = createModelSync({
    editor,
    props,
    emit,
    variableMap
  })

  return {
    editor,
    mutations: createDefaultMutationGateway(editor),
    syncFromModelValue: sync.syncFromModelValue
  }
}
