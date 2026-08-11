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

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  unit_price  NUMERIC(12, 2) NOT NULL,
  stock       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  dept   TEXT NOT NULL,
  title  TEXT NOT NULL,
  region TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  order_no    TEXT PRIMARY KEY,
  customer    TEXT NOT NULL,
  region      TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  order_date  DATE NOT NULL,
  product_id  TEXT NOT NULL REFERENCES products (id),
  employee_id TEXT NOT NULL REFERENCES employees (id)
);

CREATE TABLE IF NOT EXISTS payments (
  id        TEXT PRIMARY KEY,
  order_no  TEXT NOT NULL REFERENCES orders (order_no),
  amount    NUMERIC(12, 2) NOT NULL,
  pay_date  DATE NOT NULL,
  method    TEXT NOT NULL,
  status    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_alerts (
  product_id    TEXT PRIMARY KEY REFERENCES products (id),
  product_name  TEXT NOT NULL,
  category      TEXT NOT NULL,
  stock         INTEGER NOT NULL,
  safety_stock  INTEGER NOT NULL,
  alert_level   TEXT NOT NULL,
  warehouse     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_matrix (
  region    TEXT NOT NULL,
  category  TEXT NOT NULL,
  qty       INTEGER NOT NULL,
  amount    NUMERIC(12, 2) NOT NULL,
  month     TEXT NOT NULL,
  PRIMARY KEY (region, category, month)
);

COMMIT;
