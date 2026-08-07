import type { DatasetRecords, MockDataset } from './types'

/** 演示用订单行（2 客户 × 5 订单，供 Preview 渲染） */
export const MOCK_ORDER_ROWS: Record<string, unknown>[] = [
  { customer: '甲公司', orderNo: 'O-1001', amount: 100, orderDate: '2024-01-05' },
  { customer: '甲公司', orderNo: 'O-1002', amount: 200, orderDate: '2024-01-12' },
  { customer: '甲公司', orderNo: 'O-1003', amount: 150, orderDate: '2024-01-20' },
  { customer: '乙公司', orderNo: 'O-2001', amount: 300, orderDate: '2024-02-01' },
  { customer: '乙公司', orderNo: 'O-2002', amount: 250, orderDate: '2024-02-08' }
]

/** Dataset id → 行记录，供 renderReport 使用 */
export const MOCK_DATA_RECORDS: DatasetRecords = { orders: MOCK_ORDER_ROWS }

/** 演示用订单数据集 */
export const ORDERS_DATASET: MockDataset = {
  id: 'orders',
  label: '订单 orders',
  fields: [
    { name: 'customer', label: '客户', type: 'string' },
    { name: 'orderNo', label: '订单号', type: 'string' },
    { name: 'amount', label: '金额', type: 'number' },
    { name: 'orderDate', label: '下单日期', type: 'date' }
  ]
}

export const MOCK_DATASETS: MockDataset[] = [ORDERS_DATASET]
