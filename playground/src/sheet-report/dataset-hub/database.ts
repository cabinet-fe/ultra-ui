import {
  SEED_CUSTOMER_ROWS,
  SEED_EMPLOYEE_ROWS,
  SEED_INVENTORY_ALERT_ROWS,
  SEED_ORDER_ROWS,
  SEED_PAYMENT_ROWS,
  SEED_PRODUCT_ROWS,
  SEED_SALES_MATRIX_ROWS
} from './seeds'
import type { TableColumn, TableSchema } from './types'

/** Mock 行：列名 snake_case */
export type MockTableRows = Record<string, unknown>[]

export interface MockDatabase {
  tables: TableSchema[]
  getTable(name: string): MockTableRows | undefined
}

function toSnakeRows(
  rows: Record<string, unknown>[],
  mapping: Record<string, string>
): MockTableRows {
  return rows.map((row) => {
    const out: Record<string, unknown> = {}
    for (const [camel, snake] of Object.entries(mapping)) {
      out[snake] = row[camel]
    }
    return out
  })
}

const ORDER_COLUMNS: TableColumn[] = [
  { name: 'customer', label: '客户', type: 'string' },
  { name: 'region', label: '地区', type: 'string' },
  { name: 'order_no', label: '订单号', type: 'string' },
  { name: 'amount', label: '金额', type: 'number' },
  { name: 'order_date', label: '下单日期', type: 'date' },
  { name: 'product_id', label: '产品编号', type: 'string' },
  { name: 'employee_id', label: '业务员编号', type: 'string' }
]

const CUSTOMER_COLUMNS: TableColumn[] = [
  { name: 'id', label: '客户编号', type: 'string' },
  { name: 'name', label: '客户名称', type: 'string' },
  { name: 'region', label: '地区', type: 'string' },
  { name: 'level', label: '等级', type: 'string' },
  { name: 'contact', label: '联系人', type: 'string' },
  { name: 'phone', label: '电话', type: 'string' }
]

const PRODUCT_COLUMNS: TableColumn[] = [
  { name: 'id', label: '产品编号', type: 'string' },
  { name: 'name', label: '产品名称', type: 'string' },
  { name: 'category', label: '品类', type: 'string' },
  { name: 'unit_price', label: '单价', type: 'number' },
  { name: 'stock', label: '库存', type: 'number' }
]

const EMPLOYEE_COLUMNS: TableColumn[] = [
  { name: 'id', label: '员工编号', type: 'string' },
  { name: 'name', label: '姓名', type: 'string' },
  { name: 'dept', label: '部门', type: 'string' },
  { name: 'title', label: '岗位', type: 'string' },
  { name: 'region', label: '负责地区', type: 'string' }
]

const PAYMENT_COLUMNS: TableColumn[] = [
  { name: 'id', label: '回款编号', type: 'string' },
  { name: 'order_no', label: '订单号', type: 'string' },
  { name: 'amount', label: '回款金额', type: 'number' },
  { name: 'pay_date', label: '回款日期', type: 'date' },
  { name: 'method', label: '支付方式', type: 'string' },
  { name: 'status', label: '状态', type: 'string' }
]

const INVENTORY_ALERT_COLUMNS: TableColumn[] = [
  { name: 'product_id', label: '产品编号', type: 'string' },
  { name: 'product_name', label: '产品名称', type: 'string' },
  { name: 'category', label: '品类', type: 'string' },
  { name: 'stock', label: '当前库存', type: 'number' },
  { name: 'safety_stock', label: '安全库存', type: 'number' },
  { name: 'alert_level', label: '预警级别', type: 'string' },
  { name: 'warehouse', label: '仓库', type: 'string' }
]

const SALES_MATRIX_COLUMNS: TableColumn[] = [
  { name: 'region', label: '地区', type: 'string' },
  { name: 'category', label: '品类', type: 'string' },
  { name: 'qty', label: '销量', type: 'number' },
  { name: 'amount', label: '销售额', type: 'number' },
  { name: 'month', label: '月份', type: 'string' }
]

export const MOCK_TABLE_SCHEMAS: TableSchema[] = [
  { name: 'orders', label: '销售订单', columns: ORDER_COLUMNS },
  { name: 'customers', label: '客户', columns: CUSTOMER_COLUMNS },
  { name: 'products', label: '产品', columns: PRODUCT_COLUMNS },
  { name: 'employees', label: '员工', columns: EMPLOYEE_COLUMNS },
  { name: 'payments', label: '回款', columns: PAYMENT_COLUMNS },
  { name: 'inventory_alerts', label: '库存预警', columns: INVENTORY_ALERT_COLUMNS },
  { name: 'sales_matrix', label: '销售矩阵', columns: SALES_MATRIX_COLUMNS }
]

const ORDER_ROW_MAP = {
  customer: 'customer',
  region: 'region',
  orderNo: 'order_no',
  amount: 'amount',
  orderDate: 'order_date',
  productId: 'product_id',
  employeeId: 'employee_id'
}

const INVENTORY_ROW_MAP = {
  productId: 'product_id',
  productName: 'product_name',
  category: 'category',
  stock: 'stock',
  safetyStock: 'safety_stock',
  alertLevel: 'alert_level',
  warehouse: 'warehouse'
}

const PAYMENT_ROW_MAP = {
  id: 'id',
  orderNo: 'order_no',
  amount: 'amount',
  payDate: 'pay_date',
  method: 'method',
  status: 'status'
}

const PRODUCT_ROW_MAP = {
  id: 'id',
  name: 'name',
  category: 'category',
  unitPrice: 'unit_price',
  stock: 'stock'
}

function buildTableData(): Record<string, MockTableRows> {
  return {
    orders: toSnakeRows(SEED_ORDER_ROWS, ORDER_ROW_MAP),
    customers: toSnakeRows(SEED_CUSTOMER_ROWS, {
      id: 'id',
      name: 'name',
      region: 'region',
      level: 'level',
      contact: 'contact',
      phone: 'phone'
    }),
    products: toSnakeRows(SEED_PRODUCT_ROWS, PRODUCT_ROW_MAP),
    employees: toSnakeRows(SEED_EMPLOYEE_ROWS, {
      id: 'id',
      name: 'name',
      dept: 'dept',
      title: 'title',
      region: 'region'
    }),
    payments: toSnakeRows(SEED_PAYMENT_ROWS, PAYMENT_ROW_MAP),
    inventory_alerts: toSnakeRows(SEED_INVENTORY_ALERT_ROWS, INVENTORY_ROW_MAP),
    sales_matrix: SEED_SALES_MATRIX_ROWS.map((row) => ({ ...row }))
  }
}

/** 创建共享 mock 库（所有连接共用同一套表数据） */
export function createMockDatabase(): MockDatabase {
  const data = buildTableData()
  return {
    tables: MOCK_TABLE_SCHEMAS,
    getTable(name: string) {
      return data[name]
    }
  }
}
