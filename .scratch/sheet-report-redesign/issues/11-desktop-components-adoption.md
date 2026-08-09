Status: resolved

# 11 — desktop 组件全量复用整改（filter-bar 等）

**What to build:**
sheet-report 模块内禁用原生表单元素，全量改用 `@veltra/desktop` 组件：

- `filter-bar.vue` 按参数类型映射控件：`text → UInput`、`number → UNumberInput`、`date → UDatePicker`、`date-range → UDateRangePicker`、`select → USelect`
- 控件统一 `size="small"`，标签用样式化文本而非裸 `<label>`
- 检查 sheet-report 全模块残留的原生表单元素（input/select/button/textarea）并替换
- 参数变更时保持现有 loading 遮罩联动

**Blocked by:** 07 — 数据连接与 SQL 数据集模型（参数类型体系）, 08 — 数据源中心 drawer 重构（drawer 内原生元素）.

- [x] filter-bar 控件按新参数类型体系映射（含 date-range → UDateRangePicker）
- [x] 全模块原生表单元素清零（约定：禁用原生表单元素）
- [x] 更新 filter-bar 相关测试
