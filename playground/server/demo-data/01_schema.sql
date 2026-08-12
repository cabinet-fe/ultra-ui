-- Report 数据连接器演示库 — 表结构
-- 执行前请将连接串中的库名、账号等替换为实际值，见同目录 README.md

BEGIN;

CREATE TABLE IF NOT EXISTS customers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  region     TEXT NOT NULL,
  level      TEXT NOT NULL,
  contact    TEXT NOT NULL,
  phone      TEXT NOT NULL
);

COMMENT ON TABLE customers IS '客户';
COMMENT ON COLUMN customers.id IS '客户编号';
COMMENT ON COLUMN customers.name IS '客户名称';
COMMENT ON COLUMN customers.region IS '所属地区';
COMMENT ON COLUMN customers.level IS '客户等级';
COMMENT ON COLUMN customers.contact IS '联系人';
COMMENT ON COLUMN customers.phone IS '联系电话';

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  unit_price  NUMERIC(12, 2) NOT NULL,
  stock       INTEGER NOT NULL
);

COMMENT ON TABLE products IS '产品';
COMMENT ON COLUMN products.id IS '产品编号';
COMMENT ON COLUMN products.name IS '产品名称';
COMMENT ON COLUMN products.category IS '产品品类';
COMMENT ON COLUMN products.unit_price IS '单价';
COMMENT ON COLUMN products.stock IS '库存数量';

CREATE TABLE IF NOT EXISTS employees (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  dept   TEXT NOT NULL,
  title  TEXT NOT NULL,
  region TEXT NOT NULL
);

COMMENT ON TABLE employees IS '员工';
COMMENT ON COLUMN employees.id IS '员工编号';
COMMENT ON COLUMN employees.name IS '员工姓名';
COMMENT ON COLUMN employees.dept IS '所属部门';
COMMENT ON COLUMN employees.title IS '职位';
COMMENT ON COLUMN employees.region IS '负责地区';

CREATE TABLE IF NOT EXISTS orders (
  order_no    TEXT PRIMARY KEY,
  customer    TEXT NOT NULL,
  region      TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  order_date  DATE NOT NULL,
  product_id  TEXT NOT NULL REFERENCES products (id),
  employee_id TEXT NOT NULL REFERENCES employees (id)
);

COMMENT ON TABLE orders IS '销售订单';
COMMENT ON COLUMN orders.order_no IS '订单编号';
COMMENT ON COLUMN orders.customer IS '客户名称';
COMMENT ON COLUMN orders.region IS '销售地区';
COMMENT ON COLUMN orders.amount IS '订单金额';
COMMENT ON COLUMN orders.order_date IS '订单日期';
COMMENT ON COLUMN orders.product_id IS '产品编号';
COMMENT ON COLUMN orders.employee_id IS '销售人员编号';

CREATE TABLE IF NOT EXISTS payments (
  id        TEXT PRIMARY KEY,
  order_no  TEXT NOT NULL REFERENCES orders (order_no),
  amount    NUMERIC(12, 2) NOT NULL,
  pay_date  DATE NOT NULL,
  method    TEXT NOT NULL,
  status    TEXT NOT NULL
);

COMMENT ON TABLE payments IS '回款记录';
COMMENT ON COLUMN payments.id IS '回款单号';
COMMENT ON COLUMN payments.order_no IS '关联订单编号';
COMMENT ON COLUMN payments.amount IS '回款金额';
COMMENT ON COLUMN payments.pay_date IS '回款日期';
COMMENT ON COLUMN payments.method IS '付款方式';
COMMENT ON COLUMN payments.status IS '回款状态';

CREATE TABLE IF NOT EXISTS inventory_alerts (
  product_id    TEXT PRIMARY KEY REFERENCES products (id),
  product_name  TEXT NOT NULL,
  category      TEXT NOT NULL,
  stock         INTEGER NOT NULL,
  safety_stock  INTEGER NOT NULL,
  alert_level   TEXT NOT NULL,
  warehouse     TEXT NOT NULL
);

COMMENT ON TABLE inventory_alerts IS '库存预警';
COMMENT ON COLUMN inventory_alerts.product_id IS '产品编号';
COMMENT ON COLUMN inventory_alerts.product_name IS '产品名称';
COMMENT ON COLUMN inventory_alerts.category IS '产品品类';
COMMENT ON COLUMN inventory_alerts.stock IS '当前库存';
COMMENT ON COLUMN inventory_alerts.safety_stock IS '安全库存';
COMMENT ON COLUMN inventory_alerts.alert_level IS '预警级别';
COMMENT ON COLUMN inventory_alerts.warehouse IS '所在仓库';

CREATE TABLE IF NOT EXISTS sales_matrix (
  region    TEXT NOT NULL,
  category  TEXT NOT NULL,
  qty       INTEGER NOT NULL,
  amount    NUMERIC(12, 2) NOT NULL,
  month     TEXT NOT NULL,
  PRIMARY KEY (region, category, month)
);

COMMENT ON TABLE sales_matrix IS '销售矩阵';
COMMENT ON COLUMN sales_matrix.region IS '地区';
COMMENT ON COLUMN sales_matrix.category IS '产品品类';
COMMENT ON COLUMN sales_matrix.qty IS '销售数量';
COMMENT ON COLUMN sales_matrix.amount IS '销售金额';
COMMENT ON COLUMN sales_matrix.month IS '统计月份';

COMMIT;
