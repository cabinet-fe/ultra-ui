# 阶段 4：工具扩展机制 + USheet 组件 + 收尾

> 总览与设计决策见 [veltra-sheet-plan.md](./veltra-sheet-plan.md)。此时 core/grid/命令/公式已完整，扩展机制建立在成熟的 SheetAPI 之上。

## 任务清单

### 4.1 工具注册表 `tools/registry.ts`

- [ ] `registerTool({ id, title, icon?, group?, order?, tooltip?, visible?(ctx), disabled?(ctx), onClick(ctx) })`
- [ ] `unregisterTool(id)`；分组与分隔符渲染规则；重复 id 冲突处理

### 4.2 工具上下文 `tools/context.ts`

- [ ] `SheetContext` 门面 API：选区读写、命令执行、取值、`selection-change` / `history-change` 事件订阅
- [ ] 第三方工具**只能**通过 SheetContext 操作（保证扩展不绕过命令系统，undo 全覆盖）

### 4.3 内置工具（dogfood 扩展机制）

- [ ] undo / redo（随 `history-change` 置灰）
- [ ] 合并 / 取消合并

### 4.4 `USheet` Vue 组件（`vue/`，遵循仓库组件规范）

- [ ] `sheet.vue` / `index.ts` / `style.scss` / `style.ts`；类型进 `types/sheet.ts`（`SheetProps` / `SheetEmits` / `SheetExposed` 约定）
- [ ] 结构：toolbar（渲染注册工具）+ grid + 底部 sheet tabs
- [ ] `U` 前缀组件名、`u-` BEM 类名、样式走 `pkg:@veltra/styles` token，不写硬编码颜色
- [ ] 在包入口与 `types/index.ts` 导出

### 4.5 演示与收尾

- [ ] playground 演示页升级：注册两个示例自定义工具（"插入当前日期到选中格"、"清空选区"）
- [ ] `bun run skill:gen` 更新 `skills/veltra-ui`
- [ ] 根 `AGENTS.md` 与 `packages/sheet/AGENTS.md` 最终核对（目录、命令、已知限制）
- [ ] `vp changeset` 记录变更

## 验证清单

### 单测

- [ ] 注册自定义工具 → 出现在工具栏指定分组/顺序位；重复 id 注册按约定处理
- [ ] `visible / disabled` 随选区与 history 状态联动
- [ ] 自定义工具 onClick 内执行命令 → 可被 undo（证明扩展走命令系统）

### 人工（playground）

- [ ] 内置 undo/redo 按钮置灰状态与快捷键行为一致
- [ ] `USheet` 完整可用：多 sheet 切换、编辑、合并、公式、undo、自定义工具
- [ ] 示例自定义工具点击效果正确

### 通用门槛

- [ ] `vp pack -F @veltra/sheet` 产物含 d.ts
- [ ] `bun run lint` / `bun run test` / `bun run build` 全绿
