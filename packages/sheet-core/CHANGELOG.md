# @veltra/sheet-core

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
