import type { ExpressionEditorProps } from '@ui/types'
import type { BEM } from '@ui/utils'
import type { InjectionKey } from 'vue'

export const ExpressionEditorDIKey: InjectionKey<{
  /** 组件的 BEM 类名 */
  cls: BEM<'expression-editor'>
  /** 组件的 props */
  editorProps: ExpressionEditorProps
}> = Symbol('ExpressionEditorDIKey')
