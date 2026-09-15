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
 * 单元格常驻渲染：声明了 `#column:key` 插槽的列，输入控件常驻挂载；
 * 未声明编辑插槽的列渲染字段原始值。
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
