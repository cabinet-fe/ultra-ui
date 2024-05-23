import type { InjectionKey } from 'vue'
import type { TextEditorProps } from '.'

export const TextEditorDIKey: InjectionKey<{
  textEditorProps: TextEditorProps
}> = Symbol('TableDIKey')
