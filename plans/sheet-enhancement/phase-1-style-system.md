# Phase 1 — 单元格样式系统（样式池 / 边框 / 背景填充）

> 系列规划：sheet 包功能增强。本阶段是后续「导入导出（Phase 5）」样式保真的前置。

## 阶段目标

- 引入**样式池（StylePool）**：样式定义全表集中存储、按内容去重，单元格只持有 `StyleId`——相同样式无论多少单元格共享一份定义，降低内存与序列化体积。
- 支持**单元格背景填充**与**边框样式**（四边独立的颜色 / 线宽 / 线型）。
- 样式变更走命令系统（可 undo/redo）；VTable 侧经列 `style` 函数回调渲染，模型不感知视图。

## 架构约束（沿用 packages/sheet/AGENTS.md）

- `core/` 纯 TS，不 import vue / vtable，可无头单测。
- 一切写操作都是命令：新增命令经 `defaultCommandRegistry` 注册执行，Patch 走 `applyPatch` 唯一变更通道。
- 启用 `cell-store.ts` 中 `CellData` 的预留位 `s?: StyleId`。
- 渲染只在 grid 适配层。已确认 VTable 支持列级 `style` 函数回调 `(styleArg) => ITextStyleOption`，且样式项含 `bgColor` / `borderColor`（四边）/ `borderLineWidth`（四边）/ `borderLineDash`（见 vtable `es/ts-types/table-engine.d.ts`、`style-define.d.ts`）。

## 任务清单

1. **样式类型** — 新建 `core/style/types.ts`
   - `CellStyle { fill?, border? }`：`fill: { color: string }`；`border: { top?/right?/bottom?/left?: { style: BorderLineStyle, width: number, color: string } }`。
   - `StyleId = number`；`BorderLineStyle = 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted'`。
   - 类型预留 `font?` / `numFmt?` 扩展位（本期不实现）。
2. **样式池** — 新建 `core/style/style-pool.ts`
   - 规范化序列化（key 排序稳定）→ `Map<key, StyleId>` 去重；`intern(style): StyleId` / `get(id)` / 序列化导出。
   - 池随 `Sheet` 持有；`snapshot/restore` 序列化样式池与单元格 `s` 字段，还原后 id 映射一致。
3. **命令** — 新建 `core/command/set-cell-style.ts`
   - `SetCellStyleCommand`：选区批量、**部分合并**语义（只设 fill 时保留既有 border）；`CellPatch` 扩展 `s` 的 before/after 差量，复用现有回放通道。
   - `Sheet.setCellStyle(range, partial)` / `Sheet.clearCellStyle(range)` 入口；空样式 = 删除 `s` 字段（不破坏「空单元格不占存储」原则）。
4. **门面扩展** — `tools/context.ts`：`setCellStyle` / `clearCellStyle` / `getCellStyle`（写方法全走命令，扩展天然可 undo）。
5. **grid 渲染** — `grid/sheet-grid.ts`：列定义挂 `style` 函数，按 `StyleId` 从样式池解析为 VTable 样式（`bgColor`、四边 `borderColor` / `borderLineWidth` / `borderLineDash`）；复用 `cell-change` 事件触发重绘。
6. **内置工具** — `tools/builtin.ts`
   - 填充颜色工具：调色板弹层（复用 `@veltra/desktop` 现有取色能力），含「无填充」。
   - 边框工具：预设（全边框 / 外边框 / 下边框 / 无边框）+ 线型 / 颜色子选项。
7. **文档与技能** — 更新 `packages/sheet/AGENTS.md`（样式系统章节）；按根 AGENTS.md 约定更新 `skills/veltra-ui` 中 sheet 相关 API。

## 验证清单

- [x] `cd packages/sheet && vp test` 全绿，新增单测覆盖（2026-08：344 测试全过，含 style-pool / set-cell-style / context / builtin 用例）：
  - [x] StylePool：相同样式 `intern` 返回同一 id（去重）；不同样式不同 id；snapshot/restore 后 id 映射一致。
  - [x] `SetCellStyleCommand`：部分合并语义正确；undo/redo 精确恢复 before；批量选区 = 单 undo 单元；空样式删除 `s` 字段。
  - [x] 存储体积：N 个单元格同一填充色 → 快照中样式定义仅 1 份、每格仅存 id（断言快照体积不随 N 线性增长样式部分）。
- [x] `bun run lint`（仓库根）无错误（0 errors）。
- [x] `vp run -F @veltra/sheet build` 构建通过（全量 `bun run build` 11 包拓扑构建成功）。
- [x] playground 验证：填充色 / 边框渲染、undo/redo、tab 切换保留、合并格样式（Playwright chromium 真实浏览器 + 组件测试覆盖）。
