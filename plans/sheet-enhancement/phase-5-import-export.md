# Phase 5 — 导入导出（hucre）

> 前置：Phase 1（样式导入导出）、Phase 2（冻结导入导出）、Phase 3（多 sheet 增删改名健壮）。

## 阶段目标

- 用 [hucre](https://github.com/productdevbook/hucre)（零依赖纯 TS，读写 XLSX/CSV/ODS，支持样式 / 合并 / freezePane）实现工作簿导入导出：值、公式、合并、样式（填充 + 边框）、冻结尽量保真。
- USheet 内置「导入 / 导出 xlsx / 导出 csv」入口。

## 任务清单

1. **依赖** — `packages/sheet/package.json` `dependencies` 增加 `hucre`（`vp install` 安装；确认 treeshake / sideEffects 无碍，`hucre/xlsx`、`hucre/csv` 子路径按需导入）。
2. **导出** — 新建 `core/io/export.ts`（纯 TS，可无头测试）
   - `exportWorkbookXlsx(workbook): Promise<Uint8Array>`：多 sheet；`v`/`t` → 单元格值；`f` → 公式；合并区域；样式池 → hucre 单元格样式（fill / border）；冻结 → `freezePane`；行高列宽。
   - `exportSheetCsv(sheet): string`（`hucre/csv`，活动表，公式格导计算值）。
3. **导入** — 新建 `core/io/import.ts`
   - `importXlsx(buffer): Promise<Workbook>`：`readXlsx(buf, { readStyles: true })` → 建表、批量 `setCells`（事务包裹 = 单 undo 单元 + 单次重算编排）、合并、样式 `intern` 进样式池、冻结还原。
   - `importCsv(text, sheet)`：写入既有活动表（事务）。
4. **UI 入口** — `tools/builtin.ts` 注册导入 / 导出工具（导出 = 生成 Blob 下载；导入 = 文件选择，策略为**替换当前工作簿**并确认提示）；文件选择复用 `@veltra/desktop` 能力或原生 input。
5. **round-trip 保真** — 导出 → 再导入 → 值 / 公式 / 合并 / 样式 / 冻结抽样断言一致（作为自动化测试固定下来）。
6. **文档与技能** — 更新 `packages/sheet/AGENTS.md`（io 章节、依赖表加 hucre）；根 AGENTS.md 包依赖关系图；更新 `skills/veltra-ui`。

## 验证清单

- [ ] `cd packages/sheet && vp test` 全绿，新增单测：
  - [ ] 导出映射：各 `CellType`、公式、合并、样式、冻结 → hucre 输入结构正确。
  - [ ] 导入映射：hucre 读取结果 → 模型正确（含样式池去重生效：同样式只 intern 一次）。
  - [ ] round-trip：构造含公式 / 合并 / 样式 / 冻结的工作簿 → 导出 → 导入 → 关键字段一致。
  - [ ] 导入为单 undo 单元，undo 后恢复导入前状态。
- [ ] playground 手动验证：导出 xlsx 用 Excel / WPS / Numbers 打开样式与公式正常；导入真实 xlsx 文件数据完整；CSV 双向正常。
- [ ] `bun run lint`、`vp run -F @veltra/sheet build` 通过；`bun run build`（根）无回归。
