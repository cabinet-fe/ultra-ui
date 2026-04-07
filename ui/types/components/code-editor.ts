import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'

export type CodeEditorLang = 'js' | 'sql' | 'java' | 'json'

/** 代码编辑器组件属性 */
export interface CodeEditorProps extends FormComponentProps {
  modelValue?: string
  /** 定义语言 */
  language?: CodeEditorLang
}

/** 代码编辑器组件定义的事件 */
export interface CodeEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 代码编辑器组件暴露的属性和方法(组件内部使用) */
export interface _CodeEditorExposed {}

/** 代码编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CodeEditorExposed = DeconstructValue<_CodeEditorExposed>
