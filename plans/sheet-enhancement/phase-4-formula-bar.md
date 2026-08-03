# Phase 4 — 公式栏 + 名称框（fx 输入栏 / 选区地址显示）

> 前置：Phase 3（tab 栏交互定型后调整 USheet 布局冲突小）；公式引擎已就绪（`setCellValue` 识别 `=` 前缀自动走公式路径）。

## 阶段目标

- USheet 顶部增加 Excel 式公式栏：**名称框**（左，显示 / 输入选区地址）+ **fx 输入栏**（显示与编辑活动格的公式原文或原始文本）。
- 与网格双向同步：选区 / 单元格变化即时反映；公式栏编辑提交写回模型（`=` 开头即公式）。

## 任务清单

1. **布局** — 新建 `vue/formula-bar.vue`；USheet 结构变为 toolbar + formula-bar + grid + tabs；新增 `showFormulaBar?` prop（默认 true）；样式走 `pkg:@veltra/styles` token（`m.e` 元素类约定）。
2. **名称框**
   - 显示：单格 = A1 风格地址；区域选区 = `A1:B2`（复用 `core/address.ts` 序列化）。
   - 输入：合法地址 / 区域回车后 `selectCell` / `selectRange` 跳转并滚动可见（依赖 Phase 2 的选区回驱；若 Phase 2 未完成则仅更新模型选区）；非法地址提示且不写入。
3. **fx 输入栏**
   - 显示活动格内容：公式格 = `'=' + f` 原文（对齐网格编辑器 `FormulaAwareInputEditor` 先例），普通格 = 原始值文本；无选区时禁用。
   - 编辑：聚焦进入编辑态；Enter / ✓ 提交（`ctx.setCellValue`，`=` 前缀自动公式路径）；Esc / ✗ 取消还原；提交后保持当前选区。
4. **双向同步与编辑态锁** — 订阅活动 sheet 的 `selection-change` / `cell-change`：网格侧变化刷新公式栏；公式栏编辑期间忽略网格回写事件（编辑态锁，避免输入被打断）；网格双击编辑提交后公式栏同步显示。
5. **tab 切换适配** — 活动 sheet 变化时重绑订阅并刷新（USheet 已有重建 / 重绑模式可循）。
6. **组件暴露与类型** — `types/sheet.ts` 补 `showFormulaBar` 到 `SheetProps`；如新增暴露方法一并按 `<Name>Exposed` 约定声明。
7. **（选做）** 网格内编辑时公式栏镜像实时文本；多行输入（自动增高）。
8. **文档与技能** — 更新 `packages/sheet/AGENTS.md`（USheet 结构 / props）；更新 `skills/veltra-ui`。

## 验证清单

- [ ] `cd packages/sheet && vp test` 全绿，新增组件测试：
  - [ ] 选区变化 → 名称框 / 输入栏内容正确（普通值 / 公式原文 / 空 / 合并格锚点）。
  - [ ] 输入 `=SUM(A1:A2)` 提交 → 模型公式与计算值正确；普通文本原样存储；Esc 不改模型。
  - [ ] 名称框输入 `B3` / `B3:D5` → 选区跳转正确；非法输入被拒绝。
  - [ ] 公式栏编辑期间网格事件不打断输入；提交后网格渲染计算值。
- [ ] playground 手动验证：与网格双击编辑、填充柄、undo/redo、tab 切换的互操作无冲突。
- [ ] `bun run lint`、`vp run -F @veltra/sheet build` 通过。
