import type { InjectionKey, ShallowRef } from 'vue'
import type { TextEditorProps } from '@ui/types'

export const TextEditorDIKey: InjectionKey<{
  textEditorProps: TextEditorProps
  barContainerRef: ShallowRef<HTMLElement | undefined>
}> = Symbol('TableDIKey')
