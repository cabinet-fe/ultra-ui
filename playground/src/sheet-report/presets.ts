import type { Sheet } from '@veltra/sheet-core'

import {
  DEMO_COL_WIDTHS,
  INVENTORY_COL_WIDTHS,
  MATRIX_COL_WIDTHS,
  seedGroupDetailTemplate,
  seedInventoryAlertTemplate,
  seedMatrixTemplate,
  type DemoColWidthEntry
} from './template'

/** 商业报表预置模板 */
export interface ReportPreset {
  id: string
  label: string
  description: string
  seed: (sheet: Sheet) => void
  /** 模板关联的数据集 id */
  datasetIds: string[]
  colWidths: ReadonlyArray<DemoColWidthEntry>
}

export const REPORT_PRESETS: ReportPreset[] = [
  {
    id: 'sales-group',
    label: '销售业绩分组小计',
    description: '按客户分组展开订单明细，含组小计行',
    seed: seedGroupDetailTemplate,
    datasetIds: ['orders', 'customers'],
    colWidths: DEMO_COL_WIDTHS
  },
  {
    id: 'sales-matrix',
    label: '二维交叉矩阵',
    description: '地区 × 品类销售额交叉表，含列小计与总计',
    seed: seedMatrixTemplate,
    datasetIds: ['sales-matrix'],
    colWidths: MATRIX_COL_WIDTHS
  },
  {
    id: 'inventory-alert',
    label: '库存采购预警',
    description: '库存低于安全库存的预警明细，按级别高亮',
    seed: seedInventoryAlertTemplate,
    datasetIds: ['inventory-alerts'],
    colWidths: INVENTORY_COL_WIDTHS
  }
]

export function findReportPreset(id: string): ReportPreset | undefined {
  return REPORT_PRESETS.find((preset) => preset.id === id)
}
