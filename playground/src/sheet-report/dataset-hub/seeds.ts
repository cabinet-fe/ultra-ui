/** 原始种子行（未经查询参数筛选） */
export interface DatasetSeeds {
  orders: Record<string, unknown>[]
  customers: Record<string, unknown>[]
  products: Record<string, unknown>[]
  employees: Record<string, unknown>[]
  payments: Record<string, unknown>[]
  inventoryAlerts: Record<string, unknown>[]
  salesMatrix: Record<string, unknown>[]
}

/** 演示用订单行（4 客户 × 约 14 订单；默认模板主数据源） */
export const SEED_ORDER_ROWS: Record<string, unknown>[] = [
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

export const SEED_CUSTOMER_ROWS: Record<string, unknown>[] = [
  { id: 'C-01', name: '甲公司', region: '华东', level: 'A', contact: '张伟', phone: '13800001001' },
  { id: 'C-02', name: '乙公司', region: '华南', level: 'A', contact: '李娜', phone: '13800001002' },
  { id: 'C-03', name: '丙公司', region: '华北', level: 'B', contact: '王强', phone: '13800001003' },
  { id: 'C-04', name: '丁公司', region: '西部', level: 'B', contact: '赵敏', phone: '13800001004' },
  { id: 'C-05', name: '戊公司', region: '华东', level: 'C', contact: '陈磊', phone: '13800001005' },
  { id: 'C-06', name: '己公司', region: '华南', level: 'C', contact: '刘洋', phone: '13800001006' },
  { id: 'C-07', name: '庚公司', region: '华北', level: 'B', contact: '周杰', phone: '13800001007' },
  { id: 'C-08', name: '辛公司', region: '西部', level: 'A', contact: '吴芳', phone: '13800001008' }
]

export const SEED_PRODUCT_ROWS: Record<string, unknown>[] = [
  { id: 'P-01', name: '标准打印机', category: '办公设备', unitPrice: 1200, stock: 80 },
  { id: 'P-02', name: '激光硒鼓', category: '耗材', unitPrice: 280, stock: 200 },
  { id: 'P-03', name: 'A4 复印纸', category: '耗材', unitPrice: 45, stock: 500 },
  { id: 'P-04', name: '人体工学椅', category: '家具', unitPrice: 980, stock: 60 },
  { id: 'P-05', name: '升降桌', category: '家具', unitPrice: 1600, stock: 40 },
  { id: 'P-06', name: '无线键盘', category: '外设', unitPrice: 199, stock: 150 },
  { id: 'P-07', name: '27 寸显示器', category: '外设', unitPrice: 1899, stock: 35 },
  { id: 'P-08', name: '企业路由器', category: '网络', unitPrice: 720, stock: 55 }
]

export const SEED_EMPLOYEE_ROWS: Record<string, unknown>[] = [
  { id: 'E-01', name: '周明', dept: '华东销售', title: '客户经理', region: '华东' },
  { id: 'E-02', name: '林雪', dept: '华东销售', title: '销售代表', region: '华东' },
  { id: 'E-03', name: '黄凯', dept: '华南销售', title: '客户经理', region: '华南' },
  { id: 'E-04', name: '徐婷', dept: '华南销售', title: '销售代表', region: '华南' },
  { id: 'E-05', name: '马超', dept: '华北销售', title: '客户经理', region: '华北' },
  { id: 'E-06', name: '孙悦', dept: '西部销售', title: '客户经理', region: '西部' }
]

export const SEED_PAYMENT_ROWS: Record<string, unknown>[] = [
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

/** 库存预警明细（安全库存 vs 当前库存） */
export const SEED_INVENTORY_ALERT_ROWS: Record<string, unknown>[] = [
  {
    productId: 'P-07',
    productName: '27 寸显示器',
    category: '外设',
    stock: 35,
    safetyStock: 50,
    alertLevel: '高',
    warehouse: '上海仓'
  },
  {
    productId: 'P-05',
    productName: '升降桌',
    category: '家具',
    stock: 40,
    safetyStock: 60,
    alertLevel: '高',
    warehouse: '广州仓'
  },
  {
    productId: 'P-08',
    productName: '企业路由器',
    category: '网络',
    stock: 55,
    safetyStock: 70,
    alertLevel: '中',
    warehouse: '北京仓'
  },
  {
    productId: 'P-04',
    productName: '人体工学椅',
    category: '家具',
    stock: 60,
    safetyStock: 80,
    alertLevel: '中',
    warehouse: '成都仓'
  },
  {
    productId: 'P-01',
    productName: '标准打印机',
    category: '办公设备',
    stock: 80,
    safetyStock: 100,
    alertLevel: '低',
    warehouse: '上海仓'
  },
  {
    productId: 'P-06',
    productName: '无线键盘',
    category: '外设',
    stock: 150,
    safetyStock: 120,
    alertLevel: '正常',
    warehouse: '广州仓'
  },
  {
    productId: 'P-02',
    productName: '激光硒鼓',
    category: '耗材',
    stock: 200,
    safetyStock: 150,
    alertLevel: '正常',
    warehouse: '北京仓'
  },
  {
    productId: 'P-03',
    productName: 'A4 复印纸',
    category: '耗材',
    stock: 500,
    safetyStock: 300,
    alertLevel: '正常',
    warehouse: '成都仓'
  }
]

/** 地区 × 品类矩阵交叉数据（用于二维报表） */
export const SEED_SALES_MATRIX_ROWS: Record<string, unknown>[] = [
  { region: '华东', category: '办公设备', qty: 42, amount: 50400, month: '2024-Q1' },
  { region: '华东', category: '耗材', qty: 128, amount: 8640, month: '2024-Q1' },
  { region: '华东', category: '家具', qty: 18, amount: 46440, month: '2024-Q1' },
  { region: '华东', category: '外设', qty: 35, amount: 73465, month: '2024-Q1' },
  { region: '华东', category: '网络', qty: 12, amount: 8640, month: '2024-Q1' },
  { region: '华南', category: '办公设备', qty: 28, amount: 33600, month: '2024-Q1' },
  { region: '华南', category: '耗材', qty: 96, amount: 6480, month: '2024-Q1' },
  { region: '华南', category: '家具', qty: 22, amount: 56760, month: '2024-Q1' },
  { region: '华南', category: '外设', qty: 30, amount: 62970, month: '2024-Q1' },
  { region: '华南', category: '网络', qty: 8, amount: 5760, month: '2024-Q1' },
  { region: '华北', category: '办公设备', qty: 20, amount: 24000, month: '2024-Q1' },
  { region: '华北', category: '耗材', qty: 72, amount: 4860, month: '2024-Q1' },
  { region: '华北', category: '家具', qty: 14, amount: 36120, month: '2024-Q1' },
  { region: '华北', category: '外设', qty: 18, amount: 37782, month: '2024-Q1' },
  { region: '华北', category: '网络', qty: 10, amount: 7200, month: '2024-Q1' },
  { region: '西部', category: '办公设备', qty: 16, amount: 19200, month: '2024-Q1' },
  { region: '西部', category: '耗材', qty: 54, amount: 3645, month: '2024-Q1' },
  { region: '西部', category: '家具', qty: 12, amount: 30960, month: '2024-Q1' },
  { region: '西部', category: '外设', qty: 14, amount: 29386, month: '2024-Q1' },
  { region: '西部', category: '网络', qty: 6, amount: 4320, month: '2024-Q1' }
]

export const DEFAULT_SEEDS: DatasetSeeds = {
  orders: SEED_ORDER_ROWS,
  customers: SEED_CUSTOMER_ROWS,
  products: SEED_PRODUCT_ROWS,
  employees: SEED_EMPLOYEE_ROWS,
  payments: SEED_PAYMENT_ROWS,
  inventoryAlerts: SEED_INVENTORY_ALERT_ROWS,
  salesMatrix: SEED_SALES_MATRIX_ROWS
}
