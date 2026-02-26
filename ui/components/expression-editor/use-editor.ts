import type { LexicalEditor } from 'lexical'
import {
  createExpressionEditorRuntime,
  type CreateExpressionEditorRuntimeOptions
} from './internal/editor-runtime/create-runtime'

export type EditorOptions = CreateExpressionEditorRuntimeOptions

export function useEditor(options: EditorOptions): LexicalEditor {
  return createExpressionEditorRuntime(options).editor
}
