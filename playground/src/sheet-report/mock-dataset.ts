import type { DatasetRecords, MockDataset } from './types'

/** 演示用订单行（4 客户 × 约 14 订单，供实时预览渲染） */
export const MOCK_ORDER_ROWS: Record<string, unknown>[] = [
  { customer: '甲公司', region: '华东', orderNo: 'O-1001', amount: 100, orderDate: '2024-01-05' },
  { customer: '甲公司', region: '华东', orderNo: 'O-1002', amount: 200, orderDate: '2024-01-12' },
  { customer: '甲公司', region: '华东', orderNo: 'O-1003', amount: 150, orderDate: '2024-01-20' },
  { customer: '甲公司', region: '华东', orderNo: 'O-1004', amount: 180, orderDate: '2024-01-28' },
  { customer: '乙公司', region: '华南', orderNo: 'O-2001', amount: 300, orderDate: '2024-02-01' },
  { customer: '乙公司', region: '华南', orderNo: 'O-2002', amount: 250, orderDate: '2024-02-08' },
  { customer: '乙公司', region: '华南', orderNo: 'O-2003', amount: 220, orderDate: '2024-02-15' },
  { customer: '乙公司', region: '华南', orderNo: 'O-2004', amount: 280, orderDate: '2024-02-22' },
  { customer: '丙公司', region: '华北', orderNo: 'O-3001', amount: 400, orderDate: '2024-03-01' },
  { customer: '丙公司', region: '华北', orderNo: 'O-3002', amount: 350, orderDate: '2024-03-10' },
  { customer: '丙公司', region: '华北', orderNo: 'O-3003', amount: 320, orderDate: '2024-03-18' },
  { customer: '丁公司', region: '西部', orderNo: 'O-4001', amount: 500, orderDate: '2024-04-02' },
  { customer: '丁公司', region: '西部', orderNo: 'O-4002', amount: 450, orderDate: '2024-04-11' },
  { customer: '丁公司', region: '西部', orderNo: 'O-4003', amount: 480, orderDate: '2024-04-20' }
]

/** Dataset id → 行记录，供 renderReport 使用 */
export const MOCK_DATA_RECORDS: DatasetRecords = { orders: MOCK_ORDER_ROWS }

/** 演示用订单数据集 */
export const ORDERS_DATASET: MockDataset = {
  id: 'orders',
  label: '订单',
  fields: [
    { name: 'customer', label: '客户', type: 'string' },
    { name: 'orderNo', label: '订单号', type: 'string' },
    { name: 'region', label: '地区', type: 'string' },
    { name: 'amount', label: '金额', type: 'number' },
    { name: 'orderDate', label: '下单日期', type: 'date' }
  ]
}

export const MOCK_DATASETS: MockDataset[] = [ORDERS_DATASET]
