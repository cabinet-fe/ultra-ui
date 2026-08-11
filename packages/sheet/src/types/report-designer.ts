import type { Workbook } from '@veltra/sheet-core/core/workbook'
import type { DeconstructValue } from '@veltra/utils'

import type { DataConnection, DataConnector, ReportTemplate } from '../report'

/** 报表设计器组件属性（ADR-0003 决策 2） */
export interface ReportDesignerProps {
  /** 数据连接器（如 `createHttpConnector({ endpoint })`）：数据中枢的测试连接 / 字段解析 / 记录预览均经它 */
  connector: DataConnector
  /**
   * 数据连接列表（`v-model:connections`）：纯序列化对象，仅驻留内存；
   * 凭据的持久化与安全存储完全由宿主掌控（ADR-0003 决策 4）
   */
  connections?: DataConnection[]
  /**
   * 载入既有 Report Template 继续设计：恢复网格绑定与设计态数据集；
   * 内嵌连接按 id 合并进 `v-model:connections`（仅缺省时追加，宿主列表是单一事实源）
   */
  template?: ReportTemplate
  /** 承载设计态的工作簿（USheet 先例：缺省内部自建单 sheet 工作簿） */
  workbook?: Workbook
}

/** 报表设计器组件定义的事件 */
export interface ReportDesignerEmits {
  (e: 'update:connections', value: DataConnection[]): void
}

/** 在组件内部引用 */
export interface _ReportDesignerExposed {
  /** 取回含 meta 绑定与内嵌数据集定义的可序列化 Report Template */
  getTemplate: () => ReportTemplate
}

/** 报表设计器组件暴露的方法 */
export type ReportDesignerExposed = DeconstructValue<_ReportDesignerExposed>
