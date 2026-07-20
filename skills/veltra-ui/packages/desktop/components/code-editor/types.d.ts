import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export type CodeEditorLang =
  | 'js'
  | 'sql'
  | 'java'
  | 'json'
  | 'markdown'
  | 'spel'
  | 'bash'
  | 'powershell'

/** 代码编辑器组件属性（不支持 `size`） */
export interface CodeEditorProps extends Omit<FormComponentProps, 'size'> {
  modelValue?: string
  /**
   * 可选语言列表。长度大于 1 时在编辑器右上角显示内置语言选择器；
   * 仅一种语言时显示语言名称标签
   */
  langs?: CodeEditorLang[]
  /** 当前语言，配合 `v-model:lang` 使用 */
  lang?: CodeEditorLang
  /** 不可编辑的前缀外壳（展示在编辑器内，不计入 v-model） */
  prefix?: string
  /** 不可编辑的后缀外壳（展示在编辑器内，不计入 v-model） */
  suffix?: string
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
  (e: 'update:lang', value: CodeEditorLang | undefined): void
  /** 在编辑器失焦且内容有变更时触发 */
  (e: 'change', value: string): void
}

/** 代码编辑器组件暴露的属性和方法(组件内部使用) */
export interface _CodeEditorExposed {}

/** 代码编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CodeEditorExposed = DeconstructValue<_CodeEditorExposed>
