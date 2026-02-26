import type { LexicalEditor } from 'lexical'
import type {
  EditorMutationGateway,
  ExpressionEditorRuntime
} from '../contracts/editor-runtime'

interface CreateExpressionEditorRuntimeOptions {
  createEditor: () => LexicalEditor
  createMutationGateway?: (editor: LexicalEditor) => EditorMutationGateway
  createModelSync?: (
    input: Pick<ExpressionEditorRuntime, 'editor' | 'mutations'>
  ) => Pick<ExpressionEditorRuntime, 'syncFromModelValue'>
}

function createDefaultMutationGateway(editor: LexicalEditor): EditorMutationGateway {
  return {
    runUpdate(updater) {
      editor.update(() => {
        updater()
      })
    }
  }
}

const defaultModelSync: Pick<ExpressionEditorRuntime, 'syncFromModelValue'> = {
  syncFromModelValue() {
    // Runtime contract requires a callable sync capability.
  }
}

export function createExpressionEditorRuntime(
  options: CreateExpressionEditorRuntimeOptions
): ExpressionEditorRuntime {
  const editor = options.createEditor()
  const mutations = options.createMutationGateway
    ? options.createMutationGateway(editor)
    : createDefaultMutationGateway(editor)
  const modelSync = options.createModelSync
    ? options.createModelSync({ editor, mutations })
    : defaultModelSync

  return {
    editor,
    mutations,
    syncFromModelValue: modelSync.syncFromModelValue
  }
}
