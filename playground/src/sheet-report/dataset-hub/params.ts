import type { DatasetQueryParam } from './types'

/** 模拟 SQL 查询参数定义 */
export const QUERY_PARAMS: DatasetQueryParam[] = [
  {
    id: 'dateFrom',
    label: '开始日期',
    type: 'date',
    defaultValue: '2024-01-01',
    appliesTo: ['orders', 'payments']
  },
  {
    id: 'dateTo',
    label: '结束日期',
    type: 'date',
    defaultValue: '2024-12-31',
    appliesTo: ['orders', 'payments']
  },
  {
    id: 'region',
    label: '地区',
    type: 'select',
    defaultValue: '',
    appliesTo: ['orders', 'customers', 'sales-matrix'],
    options: [
      { label: '全部', value: '' },
      { label: '华东', value: '华东' },
      { label: '华南', value: '华南' },
      { label: '华北', value: '华北' },
      { label: '西部', value: '西部' }
    ]
  },
  {
    id: 'alertThreshold',
    label: '库存预警阈值',
    type: 'number',
    defaultValue: 80,
    appliesTo: ['inventory-alerts']
  }
]
