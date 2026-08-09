Status: resolved

# 06 — 运行态动态 Filter Bar、3 套商业模板与保真 XLSX 导出

**What to build:** 
组装报表完整产品闭环。在运行态顶部根据数据集参数配置自动渲染 Filter Bar 筛选栏（支持日期、下拉选择、数值范围）；在 Playground 中预置 3 套商业报表 Tab 模板（销售业绩分组小计表、二维交叉/矩阵报表、库存与采购预警表）；实现保真 XLSX 导出，将渲染计算得出的条件格式样式精准固化到导出的 Excel 文件中。

**Blocked by:** 03 — 可视化 Mock Data Hub (数据源与参数配置中心), 04 — 报表渲染引擎升级 (5 大语义角色展开与小计扩展), 05 — 智能画布交互 Overlay (SVG 拓扑关联弧线与悬浮 Action Pill).

- [x] 实现顶部 Filter Bar 组件，根据绑定的数据集参数定义自动生成控件并联动报表重新填充渲染
- [x] 在 `playground/src/sheet-report/` 中生成并集成 3 套商业预置 Tab 模板，可一键无缝切换预览
- [x] 添加参数更改与报表计算时的加载指示器（Loading 遮罩）
- [x] 集成保真 XLSX 文件导出功能，确认导出的 Excel 文件保留合并单元格、列宽行高及条件格式渲染颜色
