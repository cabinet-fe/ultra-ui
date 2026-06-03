import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export type CodeEditorLang = 'js' | 'sql' | 'java' | 'json'

/** 代码编辑器组件属性（不支持 `size`） */
export interface CodeEditorProps extends Omit<FormComponentProps, 'size'> {
  modelValue?: string
  /** 定义语言 */
  language?: CodeEditorLang
  /** 是否使用暗色主题 */
  dark?: boolean
  /**
   * 默认显示的行数，用于撑起编辑器最小高度，超出后滚动
   * @default 8
   */
  defaultLines?: number
}

/** 代码编辑器组件定义的事件 */
export interface CodeEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 代码编辑器组件暴露的属性和方法(组件内部使用) */
export interface _CodeEditorExposed {}

/** 代码编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CodeEditorExposed = DeconstructValue<_CodeEditorExposed>
