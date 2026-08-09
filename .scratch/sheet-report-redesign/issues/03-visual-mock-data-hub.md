Status: completed

# 03 — 可视化 Mock Data Hub (数据源与参数配置中心)

**What to build:** 
构建 `dataset-hub/` 模拟数据中心与其可视化管理界面。为设计师提供预置的多表商业模拟数据库 Catalog（包含销售明细表、库存预警表、矩阵交叉数据等），支持在 UI 中实时预览数据表 Schema、配置自定义 SQL 查询参数，并生成符合参数筛选的模拟数据集 Records。

**Blocked by:** None — can start immediately.

- [x] 实现 `dataset-hub/` 的 Mock 数据库 Catalog 数据模型与 Records 生成器
- [x] 界面支持展示多张模拟数据表、字段名称、数据类型及样例记录
- [x] 支持在数据源中心配置查询参数（例如日期范围、地区下拉框、警报阈值数字），并定义参数默认值
- [x] 导出统一的 Dataset 访问接口，供设计师面板拖拽绑定与填报引擎读取
