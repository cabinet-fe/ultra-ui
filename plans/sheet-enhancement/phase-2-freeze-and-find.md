# Phase 2 — 冻结行列 + 查找替换

> 前置：无（与 Phase 1 可并行，但建议在其后启动以免 grid 层冲突）。

## 阶段目标

- 支持冻结首行 / 首列 / 冻结到当前行列（Excel 语义），冻结状态由模型持有并随快照持久化。
- 提供**查找**（必做）与**替换**（选做）：按显示值或公式原文、大小写、整格匹配，命中定位并滚动可见。

## 技术预研（Spike，先于正式任务）

- VTable `base-table.d.ts` 同时存在 `frozenColCount` 与 `frozenRowCount` 类型，但 ListTable 下 `frozenRowCount` 的实测行为未知（1.26.5）。先用最小 demo 验证：
  - 可用 → 冻结行列照常交付；
  - 不可用 → 冻结列照常交付，冻结行降级（顶部行以表头承载）或记入已知限制，**结论写回本文件**。

## 任务清单

1. **模型** — `core/sheet.ts`：`frozen: { rows: number; cols: number }`（默认 0/0）+ getter/setter + `frozen-change` 事件；快照序列化 / 还原；**不进 undo**（同 `rowHeights` 先例）。
2. **grid 映射** — `grid/sheet-grid.ts`：`frozenColCount` / `frozenRowCount` 接入；冻结变更即时生效；tab 切换重建 grid 时还原冻结状态（同行高还原先例）。
3. **内置工具** — `tools/builtin.ts`：「冻结到当前行列」「冻结首行」「冻结首列」「取消冻结」；`disabled` / 高亮状态读当前冻结值。
4. **查找纯逻辑** — 新建 `core/find.ts`（纯函数、无头可测）
   - `findAll(sheet, query, options)`、`findNext(sheet, query, from, options)` / `findPrev`（行主序，到边界循环）。
   - options：`caseSensitive`、`wholeCell`、`searchIn: 'value' | 'formula'`（value 走 `getDisplayValue`，formula 匹配公式原文）。
5. **选区回驱** — grid 层补充「模型 → VTable」的选区回驱（现有「选区单向同步」限制，查找跳转依赖）：`selectCell`/`selectRange` 后 VTable 高亮 + `scrollToCell` 滚动可见。
6. **查找 UI** — USheet 查找条（工具触发展开，`@veltra/desktop` input/button）：关键词、上一个 / 下一个、命中计数、关闭；Enter = 下一个、Shift+Enter = 上一个。
7. **（选做）替换** — 单个替换 / 全部替换；写入走 `ctx.setCells`（全部替换 = 单 undo 单元）。

## 验证清单

- [ ] Spike 结论（`frozenRowCount` 可用性与最终方案）已写回本文件。
- [ ] `cd packages/sheet && vp test` 全绿，新增单测：
  - [ ] 冻结状态快照 / 还原；默认 0/0。
  - [ ] find：全匹配 / 大小写 / 整格 / 公式原文 / 边界循环 / 无命中。
  - [ ] 替换全部 = 单 undo 条目，undo 后全部还原。
- [ ] 冻结后滚动：冻结区固定；选区、编辑、填充柄、合并、右键菜单在冻结区与非冻结区行为不回归。
- [ ] 查找跳转后 VTable 高亮与模型选区一致，目标格滚动到可视区。
- [ ] `bun run lint`、`vp run -F @veltra/sheet build` 通过；playground 手动验证冻结工具与查找条交互。
- [ ] 更新 `packages/sheet/AGENTS.md`（冻结 / 查找 / 选区回驱变更，移除或修订「选区单向同步」限制条目）。
