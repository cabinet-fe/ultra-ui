import type { ExpressionEditorProps } from '@ui/types/components/expression-editor'
import type { BEM } from '@ui/utils'
import type { LexicalEditor } from 'lexical'
import type { InjectionKey } from 'vue'

export const ExpressionEditorDIKey: InjectionKey<{
  /** 组件的 BEM 类名 */
  cls: BEM<'expression-editor'>
  /** 组件的 props */
  editorProps: ExpressionEditorProps
  /** 编辑器实例 */
  editor: LexicalEditor
}> = Symbol('ExpressionEditorDIKey')
