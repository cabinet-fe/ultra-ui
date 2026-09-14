import type { DeconstructValue, ValidateRule } from '@veltra/utils'

import type { TableProps, TableColumn } from './table'

/** 表格编辑器列：在 TableColumn 基础上扩展按列校验 */
export interface TableEditorColumn extends TableColumn {
  /** 列校验规则，配置后值变更实时校验，表头含 required 时显示红星 */
  rules?: ValidateRule
}

/**
 * 表格型编辑器组件属性
 *
 * 单元格双态渲染：`#column:key` 声明编辑态插槽（行悬停或行内含聚焦输入时挂载），
 * `#text:key` 覆盖文本态渲染；未声明编辑插槽的列始终文本渲染。
 */
export interface TableEditorProps extends Omit<TableProps, 'data' | 'columns'> {
  /** 表格数据 */
  modelValue?: Record<string, any>[]
  /** 表格列 */
  columns?: TableEditorColumn[]
}

/** 表格型编辑器组件定义的事件 */
export interface TableEditorEmits {
  (e: 'update:modelValue', value: Record<string, any>[]): void
}

/** 表格型编辑器组件暴露的属性和方法(组件内部使用) */
export interface _TableEditorExposed {
  /** 校验全表配置了 rules 的列，全部通过 resolve true，任一失败 resolve false */
  validate(): Promise<boolean>
}

/** 表格型编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TableEditorExposed = DeconstructValue<_TableEditorExposed>
