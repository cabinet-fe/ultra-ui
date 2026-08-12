import type { Workbook } from '@veltra/sheet-core/core/workbook'
import type { DeconstructValue } from '@veltra/utils'

import type { DataConnector, ReportTemplate } from '../report'
import type { ReportColWidthEntry } from '../report/export-xlsx'

/** 报表查看器组件属性（ADR-0003 决策 2） */
export interface ReportViewerProps {
  /** 数据连接器（如 `createHttpConnector({ endpoint })`） */
  connector: DataConnector
  /**
   * 自包含 Report Template（SheetSnapshot + 内嵌数据集定义，见 `ReportTemplate`）：
   * 查看器据此提取实际绑定数据集的查询参数并集生成 Filter Bar，并经连接器取数展开渲染
   */
  template: ReportTemplate
  /** 承载填充报表的工作簿（USheet 先例：缺省内部自建单 sheet 工作簿） */
  workbook?: Workbook
  /**
   * 列宽显式覆盖（可选）：优先于模板 `colWidths` / 展开映射结果写入模型与网格。
   * 列宽已进 `SheetSnapshot.colWidths`，通常无需再传。
   */
  colWidths?: ReadonlyArray<ReportColWidthEntry>
}

/** 在组件内部引用 */
export interface _ReportViewerExposed {
  /** 重新取数并展开渲染（外部状态变化后主动刷新报表） */
  refresh: () => Promise<void>
  /**
   * 导出填充报表为 XLSX（取数完成前拒绝；内部读取填充 sheet 与运行时列宽）。
   * 不内置导出按钮，工具栏由下游决定。
   */
  exportXlsx: () => Promise<void>
}

/** 报表查看器组件暴露的方法 */
export type ReportViewerExposed = DeconstructValue<_ReportViewerExposed>
