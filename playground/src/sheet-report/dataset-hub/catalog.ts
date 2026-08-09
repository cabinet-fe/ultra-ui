import type { DatasetCatalogItem } from '../types'

/** 本报表默认选用的数据集 id（其余在目录中可选加） */
export const DEFAULT_SELECTED_DATASET_IDS = ['orders', 'customers'] as const

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

/** 全局数据集目录（7 个关联 mock） */
export const DATASET_CATALOG: DatasetCatalogItem[] = [
  ORDERS_DATASET,
  CUSTOMERS_DATASET,
  PRODUCTS_DATASET,
  EMPLOYEES_DATASET,
  PAYMENTS_DATASET,
  INVENTORY_ALERTS_DATASET,
  SALES_MATRIX_DATASET
]
