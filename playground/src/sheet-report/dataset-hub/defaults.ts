import type { DatasetCatalogItem } from '@veltra/sheet'

import type { DataConnection, DatasetDef } from './types'

export const DEFAULT_REGION_OPTIONS = [
  { label: '全部', value: '' },
  { label: '华东', value: '华东' },
  { label: '华南', value: '华南' },
  { label: '华北', value: '华北' },
  { label: '西部', value: '西部' }
] as const

/** 默认数据连接：演示业务库 */
export const DEFAULT_CONNECTION: DataConnection = {
  id: 'demo',
  label: '演示业务库',
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  database: 'demo_business',
  username: 'demo',
  password: 'demo'
}

const DATE_FROM = { label: '开始日期', type: 'date' as const, defaultValue: '2024-01-01' }
const DATE_TO = { label: '结束日期', type: 'date' as const, defaultValue: '2024-12-31' }
const REGION = {
  label: '地区',
  type: 'select' as const,
  defaultValue: '',
  options: [...DEFAULT_REGION_OPTIONS]
}

/** 预置 SQL 数据集 */
export const DEFAULT_DATASETS: DatasetDef[] = [
  {
    id: 'orders',
    label: '销售明细',
    connectionId: 'demo',
    sql: 'SELECT customer, order_no AS orderNo, region, amount, order_date AS orderDate, product_id AS productId, employee_id AS employeeId FROM orders WHERE order_date >= ${dateFrom} AND order_date <= ${dateTo} AND region = ${region}',
    paramOverrides: { dateFrom: DATE_FROM, dateTo: DATE_TO, region: REGION }
  },
  {
    id: 'customers',
    label: '客户',
    connectionId: 'demo',
    sql: 'SELECT id, name, region, level, contact, phone FROM customers WHERE region = ${region}',
    paramOverrides: { region: REGION }
  },
  {
    id: 'products',
    label: '产品',
    connectionId: 'demo',
    sql: 'SELECT id, name, category, unit_price AS unitPrice, stock FROM products'
  },
  {
    id: 'employees',
    label: '员工',
    connectionId: 'demo',
    sql: 'SELECT id, name, dept, title, region FROM employees'
  },
  {
    id: 'payments',
    label: '回款',
    connectionId: 'demo',
    sql: 'SELECT id, order_no AS orderNo, amount, pay_date AS payDate, method, status FROM payments WHERE pay_date >= ${dateFrom} AND pay_date <= ${dateTo}',
    paramOverrides: { dateFrom: DATE_FROM, dateTo: DATE_TO }
  },
  {
    id: 'inventory-alerts',
    label: '库存预警',
    connectionId: 'demo',
    sql: 'SELECT product_id AS productId, product_name AS productName, category, stock, safety_stock AS safetyStock, alert_level AS alertLevel, warehouse FROM inventory_alerts WHERE stock <= ${alertThreshold}',
    paramOverrides: { alertThreshold: { label: '库存预警阈值', type: 'number', defaultValue: 80 } }
  },
  {
    id: 'sales-matrix',
    label: '销售矩阵',
    connectionId: 'demo',
    sql: 'SELECT region, category, qty, amount, month FROM sales_matrix WHERE region = ${region}',
    paramOverrides: { region: REGION }
  }
]

/** 本报表默认选用的数据集 id */
export const DEFAULT_SELECTED_DATASET_IDS = ['orders', 'customers'] as const

/** 从数据集定义生成 catalog 项（供字段面板与绑定解析） */
export function buildCatalogFromDatasets(
  datasets: DatasetDef[],
  describe: (dataset: DatasetDef) => DatasetCatalogItem | undefined
): DatasetCatalogItem[] {
  const catalog: DatasetCatalogItem[] = []
  for (const dataset of datasets) {
    const item = describe(dataset)
    if (item) catalog.push(item)
  }
  return catalog
}

/** 兼容旧测试/模板的单数据集 catalog 常量 */
export const ORDERS_DATASET: DatasetCatalogItem = {
  id: 'orders',
  label: '销售明细',
  fields: [
    { name: 'customer', label: '客户', type: 'string' },
    { name: 'orderNo', label: '订单号', type: 'string' },
    { name: 'region', label: '地区', type: 'string' },
    { name: 'amount', label: '金额', type: 'number' },
    { name: 'orderDate', label: '下单日期', type: 'date' },
    { name: 'productId', label: '产品编号', type: 'string' },
    { name: 'employeeId', label: '业务员编号', type: 'string' }
  ]
}

export const CUSTOMERS_DATASET: DatasetCatalogItem = {
  id: 'customers',
  label: '客户',
  fields: [
    { name: 'id', label: '客户编号', type: 'string' },
    { name: 'name', label: '客户名称', type: 'string' },
    { name: 'region', label: '地区', type: 'string' },
    { name: 'level', label: '等级', type: 'string' },
    { name: 'contact', label: '联系人', type: 'string' },
    { name: 'phone', label: '电话', type: 'string' }
  ]
}

export const PRODUCTS_DATASET: DatasetCatalogItem = {
  id: 'products',
  label: '产品',
  fields: [
    { name: 'id', label: '产品编号', type: 'string' },
    { name: 'name', label: '产品名称', type: 'string' },
    { name: 'category', label: '品类', type: 'string' },
    { name: 'unitPrice', label: '单价', type: 'number' },
    { name: 'stock', label: '库存', type: 'number' }
  ]
}

export const EMPLOYEES_DATASET: DatasetCatalogItem = {
  id: 'employees',
  label: '员工',
  fields: [
    { name: 'id', label: '员工编号', type: 'string' },
    { name: 'name', label: '姓名', type: 'string' },
    { name: 'dept', label: '部门', type: 'string' },
    { name: 'title', label: '岗位', type: 'string' },
    { name: 'region', label: '负责地区', type: 'string' }
  ]
}

export const PAYMENTS_DATASET: DatasetCatalogItem = {
  id: 'payments',
  label: '回款',
  fields: [
    { name: 'id', label: '回款编号', type: 'string' },
    { name: 'orderNo', label: '订单号', type: 'string' },
    { name: 'amount', label: '回款金额', type: 'number' },
    { name: 'payDate', label: '回款日期', type: 'date' },
    { name: 'method', label: '支付方式', type: 'string' },
    { name: 'status', label: '状态', type: 'string' }
  ]
}

export const INVENTORY_ALERTS_DATASET: DatasetCatalogItem = {
  id: 'inventory-alerts',
  label: '库存预警',
  fields: [
    { name: 'productId', label: '产品编号', type: 'string' },
    { name: 'productName', label: '产品名称', type: 'string' },
    { name: 'category', label: '品类', type: 'string' },
    { name: 'stock', label: '当前库存', type: 'number' },
    { name: 'safetyStock', label: '安全库存', type: 'number' },
    { name: 'alertLevel', label: '预警级别', type: 'string' },
    { name: 'warehouse', label: '仓库', type: 'string' }
  ]
}

export const SALES_MATRIX_DATASET: DatasetCatalogItem = {
  id: 'sales-matrix',
  label: '销售矩阵',
  fields: [
    { name: 'region', label: '地区', type: 'string' },
    { name: 'category', label: '品类', type: 'string' },
    { name: 'qty', label: '销量', type: 'number' },
    { name: 'amount', label: '销售额', type: 'number' },
    { name: 'month', label: '月份', type: 'string' }
  ]
}

export const DATASET_CATALOG: DatasetCatalogItem[] = [
  ORDERS_DATASET,
  CUSTOMERS_DATASET,
  PRODUCTS_DATASET,
  EMPLOYEES_DATASET,
  PAYMENTS_DATASET,
  INVENTORY_ALERTS_DATASET,
  SALES_MATRIX_DATASET
]
