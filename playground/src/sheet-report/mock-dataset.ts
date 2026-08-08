import type { DatasetCatalogItem, DatasetRecords } from './types'

/** 本报表默认选用的数据集 id（其余在目录中可选加） */
export const DEFAULT_SELECTED_DATASET_IDS = ['orders', 'customers'] as const

/** 演示用订单行（4 客户 × 约 14 订单；默认模板主数据源） */
export const MOCK_ORDER_ROWS: Record<string, unknown>[] = [
  {
    customer: '甲公司',
    region: '华东',
    orderNo: 'O-1001',
    amount: 100,
    orderDate: '2024-01-05',
    productId: 'P-01',
    employeeId: 'E-01'
  },
  {
    customer: '甲公司',
    region: '华东',
    orderNo: 'O-1002',
    amount: 200,
    orderDate: '2024-01-12',
    productId: 'P-02',
    employeeId: 'E-01'
  },
  {
    customer: '甲公司',
    region: '华东',
    orderNo: 'O-1003',
    amount: 150,
    orderDate: '2024-01-20',
    productId: 'P-03',
    employeeId: 'E-02'
  },
  {
    customer: '甲公司',
    region: '华东',
    orderNo: 'O-1004',
    amount: 180,
    orderDate: '2024-01-28',
    productId: 'P-01',
    employeeId: 'E-02'
  },
  {
    customer: '乙公司',
    region: '华南',
    orderNo: 'O-2001',
    amount: 300,
    orderDate: '2024-02-01',
    productId: 'P-04',
    employeeId: 'E-03'
  },
  {
    customer: '乙公司',
    region: '华南',
    orderNo: 'O-2002',
    amount: 250,
    orderDate: '2024-02-08',
    productId: 'P-05',
    employeeId: 'E-03'
  },
  {
    customer: '乙公司',
    region: '华南',
    orderNo: 'O-2003',
    amount: 220,
    orderDate: '2024-02-15',
    productId: 'P-02',
    employeeId: 'E-04'
  },
  {
    customer: '乙公司',
    region: '华南',
    orderNo: 'O-2004',
    amount: 280,
    orderDate: '2024-02-22',
    productId: 'P-06',
    employeeId: 'E-04'
  },
  {
    customer: '丙公司',
    region: '华北',
    orderNo: 'O-3001',
    amount: 400,
    orderDate: '2024-03-01',
    productId: 'P-07',
    employeeId: 'E-05'
  },
  {
    customer: '丙公司',
    region: '华北',
    orderNo: 'O-3002',
    amount: 350,
    orderDate: '2024-03-10',
    productId: 'P-03',
    employeeId: 'E-05'
  },
  {
    customer: '丙公司',
    region: '华北',
    orderNo: 'O-3003',
    amount: 320,
    orderDate: '2024-03-18',
    productId: 'P-08',
    employeeId: 'E-01'
  },
  {
    customer: '丁公司',
    region: '西部',
    orderNo: 'O-4001',
    amount: 500,
    orderDate: '2024-04-02',
    productId: 'P-04',
    employeeId: 'E-06'
  },
  {
    customer: '丁公司',
    region: '西部',
    orderNo: 'O-4002',
    amount: 450,
    orderDate: '2024-04-11',
    productId: 'P-05',
    employeeId: 'E-06'
  },
  {
    customer: '丁公司',
    region: '西部',
    orderNo: 'O-4003',
    amount: 480,
    orderDate: '2024-04-20',
    productId: 'P-07',
    employeeId: 'E-03'
  }
]

export const MOCK_CUSTOMER_ROWS: Record<string, unknown>[] = [
  { id: 'C-01', name: '甲公司', region: '华东', level: 'A', contact: '张伟', phone: '13800001001' },
  { id: 'C-02', name: '乙公司', region: '华南', level: 'A', contact: '李娜', phone: '13800001002' },
  { id: 'C-03', name: '丙公司', region: '华北', level: 'B', contact: '王强', phone: '13800001003' },
  { id: 'C-04', name: '丁公司', region: '西部', level: 'B', contact: '赵敏', phone: '13800001004' },
  { id: 'C-05', name: '戊公司', region: '华东', level: 'C', contact: '陈磊', phone: '13800001005' },
  { id: 'C-06', name: '己公司', region: '华南', level: 'C', contact: '刘洋', phone: '13800001006' },
  { id: 'C-07', name: '庚公司', region: '华北', level: 'B', contact: '周杰', phone: '13800001007' },
  { id: 'C-08', name: '辛公司', region: '西部', level: 'A', contact: '吴芳', phone: '13800001008' }
]

export const MOCK_PRODUCT_ROWS: Record<string, unknown>[] = [
  { id: 'P-01', name: '标准打印机', category: '办公设备', unitPrice: 1200, stock: 80 },
  { id: 'P-02', name: '激光硒鼓', category: '耗材', unitPrice: 280, stock: 200 },
  { id: 'P-03', name: 'A4 复印纸', category: '耗材', unitPrice: 45, stock: 500 },
  { id: 'P-04', name: '人体工学椅', category: '家具', unitPrice: 980, stock: 60 },
  { id: 'P-05', name: '升降桌', category: '家具', unitPrice: 1600, stock: 40 },
  { id: 'P-06', name: '无线键盘', category: '外设', unitPrice: 199, stock: 150 },
  { id: 'P-07', name: '27 寸显示器', category: '外设', unitPrice: 1899, stock: 35 },
  { id: 'P-08', name: '企业路由器', category: '网络', unitPrice: 720, stock: 55 }
]

export const MOCK_EMPLOYEE_ROWS: Record<string, unknown>[] = [
  { id: 'E-01', name: '周明', dept: '华东销售', title: '客户经理', region: '华东' },
  { id: 'E-02', name: '林雪', dept: '华东销售', title: '销售代表', region: '华东' },
  { id: 'E-03', name: '黄凯', dept: '华南销售', title: '客户经理', region: '华南' },
  { id: 'E-04', name: '徐婷', dept: '华南销售', title: '销售代表', region: '华南' },
  { id: 'E-05', name: '马超', dept: '华北销售', title: '客户经理', region: '华北' },
  { id: 'E-06', name: '孙悦', dept: '西部销售', title: '客户经理', region: '西部' }
]

export const MOCK_PAYMENT_ROWS: Record<string, unknown>[] = [
  {
    id: 'PAY-01',
    orderNo: 'O-1001',
    amount: 100,
    payDate: '2024-01-10',
    method: '银行转账',
    status: '已到账'
  },
  {
    id: 'PAY-02',
    orderNo: 'O-1002',
    amount: 100,
    payDate: '2024-01-18',
    method: '银行转账',
    status: '已到账'
  },
  {
    id: 'PAY-03',
    orderNo: 'O-1002',
    amount: 100,
    payDate: '2024-01-25',
    method: '支票',
    status: '已到账'
  },
  {
    id: 'PAY-04',
    orderNo: 'O-1003',
    amount: 150,
    payDate: '2024-01-28',
    method: '银行转账',
    status: '已到账'
  },
  {
    id: 'PAY-05',
    orderNo: 'O-2001',
    amount: 300,
    payDate: '2024-02-05',
    method: '银行转账',
    status: '已到账'
  },
  {
    id: 'PAY-06',
    orderNo: 'O-2002',
    amount: 150,
    payDate: '2024-02-12',
    method: '支付宝',
    status: '已到账'
  },
  {
    id: 'PAY-07',
    orderNo: 'O-2002',
    amount: 100,
    payDate: '2024-02-20',
    method: '支付宝',
    status: '部分到账'
  },
  {
    id: 'PAY-08',
    orderNo: 'O-3001',
    amount: 200,
    payDate: '2024-03-05',
    method: '银行转账',
    status: '已到账'
  },
  {
    id: 'PAY-09',
    orderNo: 'O-3001',
    amount: 200,
    payDate: '2024-03-15',
    method: '银行转账',
    status: '已到账'
  },
  {
    id: 'PAY-10',
    orderNo: 'O-4001',
    amount: 250,
    payDate: '2024-04-08',
    method: '银行转账',
    status: '已到账'
  },
  {
    id: 'PAY-11',
    orderNo: 'O-4001',
    amount: 250,
    payDate: '2024-04-18',
    method: '支票',
    status: '待确认'
  },
  {
    id: 'PAY-12',
    orderNo: 'O-4003',
    amount: 480,
    payDate: '2024-04-28',
    method: '银行转账',
    status: '已到账'
  }
]

/** Dataset id → 行记录，供 renderReport 使用 */
export const MOCK_DATA_RECORDS: DatasetRecords = {
  orders: MOCK_ORDER_ROWS,
  customers: MOCK_CUSTOMER_ROWS,
  products: MOCK_PRODUCT_ROWS,
  employees: MOCK_EMPLOYEE_ROWS,
  payments: MOCK_PAYMENT_ROWS
}

/** 演示用订单数据集（默认模板绑定此集；catalog） */
export const ORDERS_DATASET: DatasetCatalogItem = {
  id: 'orders',
  label: '订单',
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

/** 全局数据集目录（5 个关联 mock；非「本报表已选用」） */
export const DATASET_CATALOG: DatasetCatalogItem[] = [
  ORDERS_DATASET,
  CUSTOMERS_DATASET,
  PRODUCTS_DATASET,
  EMPLOYEES_DATASET,
  PAYMENTS_DATASET
]

/** @deprecated 使用 DATASET_CATALOG */
export const MOCK_DATASETS = DATASET_CATALOG
