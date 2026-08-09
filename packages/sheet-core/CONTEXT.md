# Context: Sheet Report (报表系统)

本文档定义了 `@veltra/sheet` & `@veltra/sheet-core` 中报表系统的统一领域术语（Ubiquitous Language）与架构约束。

## 领域词汇表 (Domain Glossary)

| 术语 | 英文 | 描述 | 排除同义词 (禁用) |
| --- | --- | --- | --- |
| **布局角色** | Layout Role | 赋予单元格的报表语义角色，包含 `Group Header`（分组头）、`Detail Row`（明细行）、`Subtotal`（小计）、`Grand Total`（总计）、`Matrix Cross`（交叉点）。 | 左父格/上父格/展开方向硬核坐标 |
| **分组头** | Group Header | 替代 `aggregate: group`。按字段值自动去重、分组并垂直/水平展开与合并单元格。 | 聚合根/主格子 |
| **明细行** | Detail Row | 替代 `aggregate: select`。跟随上级分组展开输出多条数据集记录明细。 | 列表格/展开格 |
| **小计行** | Subtotal Row | 替代 `aggregate: sum` + 复杂父格推导。对当前所属分组内的记录进行汇总或计算。 | 组内合计 |
| **总计行** | Grand Total Row | 对数据集或全表记录进行全局最终汇总计算。 | 全局小计 |
| **矩阵交叉点** | Matrix Cross | 在二维交叉报表中，横向列分组与纵向行分组相交构成的计算单元格。 | 交叉网格 |
| **数据源中心** | Mock Data Hub | 可视化模拟数据库管理、SQL/拖拽 Join 查询及声明式参数配置中心。 | 数据源配置弹窗 |
| **参数筛选栏** | Filter Bar | 在报表运行态/预览态根据数据集参数 Schema 自动生成的极简交互式筛选 UI 控件组。 | 检索面板 |
| **拓扑连线** | Topology Overlay | 在 Sheet 网格上方使用 SVG 绘制的动态连接线，直观高亮子格与父分组格的依赖拓扑关系。 | 依赖关系线 |
| **就地操作胶囊** | Action Pill | 悬浮于选中单元格正上方的小型微控面板，支持一键更改角色、配置条件格式或清除绑定。 | 快捷浮窗 |
| **动态条件样式** | Conditional Style Patch | 视口渲染时根据数据求值规则（如 `val > 100`）动态作用于单元格的样式 Patch，与 `StylePool` 享元共享样式并行共存。 | 静态高亮 |

---

## 架构约束 (Architecture Constraints)

1. **统一角色声明**：所有单元格报表绑定必须通过 `ReportRole` 语义进行描述，严禁在 UI 交互层直接向用户暴露 `LeftParent` 坐标计算。
2. **样式双轨制**：
   - 静态基础样式归属于 `@veltra/sheet-core` 的 `StylePool`。
   - 视口计算样式通过 `resolveCellStyle` Hook 在绘制时叠加，保持视口虚拟化零性能损耗。
3. **导出打平机制**：生成持久化快照或导出 XLSX 时，必须将满足条件的动态样式合并写入 `SheetSnapshot.styles` 与 `StylePool`，确保 Excel 打开文件完全保真。
