# Phase 3 — 多 Sheet 管理（添加 / 删除 / 重命名）

> 前置：无强依赖；建议先于 Phase 5（导入多 sheet 文件需要健壮的增删改名）。

## 阶段目标

- 底部 tab 栏交互补全：「+」添加 sheet、tab 右键菜单删除 / 重命名、删除二次确认。
- 修复两个已知限制（见 `packages/sheet/AGENTS.md`）：重命名后跨表引用跟随；删除 sheet 后引用方标脏为 `#REF!`。

## 现状

- `Workbook` 已有 `addSheet` / `removeSheet` / `activateSheet` 与 `sheets-change` / `active-sheet-change` 事件；USheet 底部 tabs 仅支持切换。
- 已知限制：sheet `name` 是公开可变字段，依赖图按名索引 —— 直接改名引用不跟随；`removeSheet` 不触发其它表重算。

## 任务清单

1. **重命名 API** — `core/workbook.ts`：`renameSheet(oldName, newName): boolean`
   - 校验：空名 / 与现有表重名（含自身大小写变体，与 Excel 一致不区分大小写）→ 拒绝。
   - `DependencyGraph` 增加按名重索引能力，改名后既有引用保持有效；发 `sheet-rename` 事件。
   - `Sheet.name` 改为受控（私有 + getter），杜绝绕过 Workbook 的直接改名。
2. **删除健壮性** — `core/workbook.ts` / `core/formula/dependency-graph.ts`：`removeSheet` 注销表前收集引用该表的公式节点并标脏，触发重算 → 引用方显示 `#REF!`。
3. **tab 栏 UI** — `vue/sheet.vue`
   - 末尾「+」按钮添加 sheet（自动激活新表）。
   - tab 右键菜单（`contextmenu.pop`，从 `@veltra/desktop` 主入口导入，勿深导入）：重命名 / 删除。
   - 重命名：行内输入或对话框，冲突时提示且不写入；删除：`message-confirm` 确认，最后一个 sheet 禁删（菜单项禁用）。
4. **门面边界** — 确认 `SheetContext` 是否暴露 sheet 增删改名（增删不走 undo，与命令系统边界需在 `packages/sheet/AGENTS.md` 记录结论）。
5. **文档与技能** — 更新 `packages/sheet/AGENTS.md`（移除已修复的两条已知限制、补 tab 交互说明）；更新 `skills/veltra-ui` 相关 API。

## 验证清单

- [ ] `cd packages/sheet && vp test` 全绿，新增单测：
  - [ ] `renameSheet`：重名 / 空名拒绝；改名后跨表引用值不变（跟随改名）；undo/redo 回放不破坏引用。
  - [ ] `removeSheet`：引用方公式变为 `#REF!`；最后一个 sheet 删除返回 false；删除激活项后相邻激活正确。
- [ ] playground 手动验证：添加 / 删除 / 重命名全流程；删除确认弹窗；tab 右键菜单与既有单元格右键菜单互不干扰。
- [ ] 跨表公式场景（playground 预置 Sheet1↔Sheet2 引用）：改 Sheet2 名 → Sheet1 公式仍正确；删 Sheet2 → Sheet1 显示 `#REF!`。
- [ ] `bun run lint`、`vp run -F @veltra/sheet build` 通过。
