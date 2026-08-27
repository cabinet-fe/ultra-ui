# @veltra/sheet-core

## 2.5.1

### Patch Changes

- 293879a: - 支持浮动图片滚轮滚动与移动端触控拖拽滚动；移动端只读与非只读模式下触控滑动与图片选中的手势互斥联动。
  - 修复多 sheet 导入样式串色、主题色映射、换行行高估算、换行符渲染消失与字数截断问题。
  - 修复默认选区及点击合并单元格时选区框未包裹完整合并范围的问题。
  - 修复 xlsx 导入及合并格边界边框丢失问题。
  - 优化公式栏展开交互为悬停/聚焦时展开，避免选中即遮挡网格。

## 2.5.0

## 2.4.0

### Minor Changes

- 52d421b: feat(sheet-core): 新增单元格级只读标记（`Sheet.setCellReadonly` / `setRangeReadonly` / `isCellReadonly`，经 Cell Meta 存储，可撤销、随快照序列化、行列结构平移）；SheetGrid 拦截只读格编辑——不开启编辑器（双击/Enter）、`CHANGE_CELL_VALUE` 回写守卫、填充柄跳过只读目标格，支撑表格化填报场景

## 2.3.4

### Patch Changes

- d6144bb: 支持 `Workbook.addSheet` 初始数据与渲染尺寸配置；新增 `exportSheetXlsx` 单表保真导出；优化 `importXlsx` 分片构建与进度回调。

## 2.3.3

### Patch Changes

- c951706: - `@veltra/sheet-core`：优化表格网格与浮动图性能。改用 `customComputeRowHeight` 按需获取行高并预置列宽，避免全量行高数组遍历与反复重绘；优化单元格遍历与图片图层 DOM / ObjectURL 管理。
  - `@veltra/sheet`：优化 sheet 切换激活逻辑，避免切 tab 时全量重放列宽与重复同步模型。
  - `@veltra/ai`：优化 AI 对话样式。加固 Markstream 变量作用域与小屏列表边距，调整折叠工具项与输入框层级阴影样式。

## 2.3.2

### Patch Changes

- a249243: - `@veltra/sheet-core`：解耦 `SheetGrid` 等渲染层符号至独立子路径 `@veltra/sheet-core/grid`，避免主入口把 `@visactor/vtable` 类型图拉入无头 TS 程序；优化 xlsx 导入性能，只遍历有效 cells Map，并对超大空白格式格设置紧邻带限制，避免极端表格卡死。
  - `@veltra/sheet`：适配 `@veltra/sheet-core/grid` 导出与 xlsx 导入选项。
  - `@veltra/desktop`：file-viewer 动态导入适配 `@veltra/sheet-core/grid`。

## 2.3.1

### Patch Changes

- 2de2112: - 修复 UPalette 对非 `#RRGGBB` 颜色（xlsx 8 位 ARGB、`rgb()` 等）解析错误导致圆形指示器不显示绑定颜色的问题；sheet-core 导入时将 8 位 ARGB 归一为 `#RRGGBB`
  - UNumberInput：步进值为 1 时不再播放数字滚动动画
  - 修复报表数据预览使用未提交的旧 SQL 导致取数为空的问题（预览前自动落草稿）

## 2.3.0

### Minor Changes

- afee8a6: 新增行/列默认样式：`Sheet.setRowStyle`/`setColStyle`（部分合并语义，经命令进 undo），有效样式 = 列 → 行 → 格字段级叠加（`getEffectiveStyle` / `composeCellStyles`）；`SheetSnapshot` 与 `SnapshotPatch` 新增 `rowStyles`/`colStyles`/`colWidths`，随 `restoreContent` 还原；列宽随快照持久化（对称 `rowHeights`，不进 undo）；报表新增 `apply-style` 工具，设计器/查看器/导出适配行列样式。

## 2.2.0

### Minor Changes

- d37ae9b: 新增单元格渲染扩展口 `resolveCellRenderer`（ADR-0004）：`SheetGridOptions` / `SheetProps` 新增对称 hook，`buildColumns` 仅在宿主提供 hook 时安装按格 customLayout 分发器，按格回调（表格坐标转模型地址，合并格落锚点），返回 `undefined` 回落默认渲染；hook 不写模型、不进快照。配套导出 VTable 布局构建工具 `CustomLayout`（Container/Text/Rect…）与类型 `ICustomLayoutObj`。cell hook 性能契约（纯函数/同步/O(1)/禁大对象分配）写入 `packages/sheet-core/AGENTS.md`。

## 2.1.1

## 2.1.0

### Minor Changes

- 4368035: 新增 `@veltra/sheet-core` 包，file-viewer Excel 预览迁移：

  - **@veltra/sheet-core（新包）**：框架无关表格核心——`core/`（数据模型 / 命令 / 公式 / IO）+
    `grid/`（VTable 适配层 SheetGrid / ImageLayer）自 `@veltra/sheet` 迁入；SheetGrid 新增
    `readonly` 模式（不挂编辑器、禁编辑回写 / 填充柄 / undo 快捷键 / 行列 resize / 图片拖动删除，
    保留选择 / 滚动 / 右键回调），供只读预览场景使用
  - **@veltra/sheet**：core/grid 迁至 sheet-core，`src/index.ts` 从其 re-export 白名单，
    公开 API 不变；peer 新增 `@veltra/sheet-core`，`@visactor/vtable(-editors)` 不再直接依赖
  - **@veltra/desktop**：file-viewer 的 Excel/CSV 预览从 `@cat-kit/excel` + 裸 `ListTable`
    迁移到 `@veltra/sheet-core`（readonly SheetGrid）——样式 / 合并单元格 / 行高 / 冻结 /
    公式计算保真；peer 移除 `@cat-kit/excel`、新增 `@veltra/sheet-core`，dependencies
    移除 `@visactor/vtable`；`sheetMaxRows` 不再硬裁模型（超限时提示条文案改为如实说明）
