import type { LexicalEditor } from 'lexical'

export interface EditorMutationGateway {
  runUpdate(updater: () => void): void
}

export interface ExpressionEditorRuntime {
  editor: LexicalEditor
  mutations: EditorMutationGateway
  syncFromModelValue(): void
}
