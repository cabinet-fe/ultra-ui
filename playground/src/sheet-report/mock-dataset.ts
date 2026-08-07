import type { MockDataset } from './types'

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
