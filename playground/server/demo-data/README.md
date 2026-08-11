# Report 数据连接器 — PostgreSQL 演示数据

为 `playground` 的 sheet-report 演示准备的业务库种子数据，表结构与字段名对齐原 mock Data Hub（`orders` / `customers` / `products` 等 7 张表）。

## 连接信息（自行填写）

```text
主机:     YOUR_HOST          # 例 127.0.0.1
端口:     YOUR_PORT          # 例 5432
数据库:   YOUR_DATABASE      # 例 demo_business
用户名:   YOUR_USERNAME      # 例 postgres
密码:     YOUR_PASSWORD
```

连接串示例：

```text
postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/YOUR_DATABASE
```

在 UReportDesigner「数据中枢」中配置连接时：

| 字段 | 值 |
| --- | --- |
| 类型 | `postgresql` |
| host | `YOUR_HOST` |
| port | `YOUR_PORT` |
| database | `YOUR_DATABASE` |
| username / password | 同上 |

前端经 `createHttpConnector({ endpoint: '/report-api' })` 取数；需先 `cd playground && vp dev` 启动契约参考服务。

## 环境变量配置在哪？

**推荐：写在 `playground/.env`**（已被 git 忽略，不会提交密码）。

在仓库里打开或新建 `playground/.env`，加入例如：

```env
# 方式 1：连接串（推荐）
REPORT_DEMO_PG_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:5432/YOUR_DATABASE?sslmode=require
PG_SSL=true

# 方式 2：分项填写（与连接串二选一即可）
# PG_HOST=your-remote-host
# PG_PORT=5432
# PG_DATABASE=YOUR_DATABASE
# PG_USER=YOUR_USERNAME
# PG_PASSWORD=YOUR_PASSWORD
# PG_SSL=true
```

然后在 `playground` 目录执行 `bun run seed-demo` 即可，**Bun 会自动读取同目录下的 `.env`**。

其他方式（任选）：

| 方式 | 说明 |
| --- | --- |
| 命令行临时传入 | `PG_HOST=... bun run seed-demo`（只对当次终端有效） |
| 改 `seed.ts` 里 `FALLBACK` | 文件顶部占位对象，适合本地快速试，勿提交真实密码 |
| Shell 配置 | `~/.zshrc` 等，对所有终端会话生效 |

## 导入步骤

### 方式 A：JS 脚本（推荐，适合远端库）

在 `playground` 目录执行：

```bash
cd playground

# 连接串（远端库常带 sslmode）
REPORT_DEMO_PG_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/YOUR_DATABASE?sslmode=require" \
  PG_SSL=true \
  bun run seed-demo
```

或分项环境变量：

```bash
PG_HOST=your-remote-host \
PG_PORT=5432 \
PG_DATABASE=YOUR_DATABASE \
PG_USER=YOUR_USERNAME \
PG_PASSWORD=YOUR_PASSWORD \
PG_SSL=true \
bun run seed-demo
```

可选参数：

```bash
bun run seed-demo -- --schema-only   # 仅建表
bun run seed-demo -- --seed-only     # 仅灌数据（表已存在时）
```

脚本入口：`server/demo-data/seed.ts`。也可直接改文件顶部 `FALLBACK` 对象（勿提交真实密码）。

### 方式 B：psql

```bash
# 1. 建库（如尚未创建，在 psql / 管理工具中执行一次即可）
# CREATE DATABASE YOUR_DATABASE ENCODING 'UTF8';

# 2. 建表
psql "postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/YOUR_DATABASE" \
  -f playground/server/demo-data/01_schema.sql

# 3. 灌入演示数据（会先 TRUNCATE 再 INSERT，可重复执行）
psql "postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/YOUR_DATABASE" \
  -f playground/server/demo-data/02_seed.sql
```

## 推荐数据集 SQL

导入后可在设计器里新建数据集，直接使用下列 SQL（含 `${param}` 查询参数）：

**销售明细**

```sql
SELECT customer, order_no AS orderNo, region, amount, order_date AS orderDate, product_id AS productId, employee_id AS employeeId
FROM orders
WHERE order_date >= ${dateFrom} AND order_date <= ${dateTo}
  AND (${region} = '' OR region = ${region})
```

> 地区参数留空表示不过滤；Filter Bar 可为 `region` 配置「全部」选项，值为空字符串。

**客户**

```sql
SELECT id, name, region, level, contact, phone
FROM customers
WHERE ${region} = '' OR region = ${region}
```

**产品**

```sql
SELECT id, name, category, unit_price AS unitPrice, stock FROM products
```

**员工**

```sql
SELECT id, name, dept, title, region FROM employees
```

**回款**

```sql
SELECT id, order_no AS orderNo, amount, pay_date AS payDate, method, status
FROM payments
WHERE pay_date >= ${dateFrom} AND pay_date <= ${dateTo}
```

**库存预警**

```sql
SELECT product_id AS productId, product_name AS productName, category, stock, safety_stock AS safetyStock, alert_level AS alertLevel, warehouse
FROM inventory_alerts
WHERE stock <= ${alertThreshold}
```

**销售矩阵（二维交叉表示例）**

```sql
SELECT region, category, qty, amount, month
FROM sales_matrix
WHERE ${region} = '' OR region = ${region}
```

## 冒烟

```bash
curl -X POST http://localhost:8787/test -H "Content-Type: application/json" \
  -d '{"connection":{"id":"pg-demo","label":"本地 PG","type":"postgresql","host":"YOUR_HOST","port":YOUR_PORT,"database":"YOUR_DATABASE","username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}}'
```
