# Phase 6: Repair Phase 5 Regression Gate - Research

**Researched:** 2026-02-26
**Domain:** Test infrastructure repair, Vitest, regression gate restoration
**Confidence:** HIGH

## Summary

Phase 5 的回归闸门失效根因已确认：**commit cad4e75b ("chore: 杂项") 删除了 4 个测试文件**（共 433 行），导致 `bun run test:phase5` 返回 "No test files found"。这 4 个文件在 Phase 05-03 中创建（81ce7872, 6d75296e, 8e4557e7），随后在后续杂项提交中被意外移除。

修复策略：从 git 历史恢复 4 个测试文件到 `ui/components/expression-editor/__test__/`，确保 vitest 能解析 `@ui` 别名，并验证 `bun run test:phase5` 稳定通过。无需重写测试逻辑，当前 expression-editor 实现与 8e4557e7 时的测试契约兼容。

**Primary recommendation:** 使用 `git show 8e4557e7:<path>` 恢复 4 个测试文件，在 vitest.config.ts 中添加 `@ui` resolve alias（若缺失），然后运行 `bun run test:phase5` 验证。

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ARCH-01 | Developer can identify and modify expression editor responsibilities in modular boundaries without touching unrelated code paths | architecture-boundaries.test.ts 断言 sync/insertion/drag-drop/command packs 边界；恢复后即可自动化验证 |
| ARCH-02 | Developer can extend expression editor internals while preserving existing public API compatibility for consumers | architecture-compatibility.test.ts 锁定 UExpressionEditor、ExpressionEditorProps、update:modelValue；恢复后即可自动化验证 |
| STAB-03 | Existing `{variable}` expression strings remain parseable, editable, and serializable after the refactor | parser.test.ts 覆盖 round-trip 与边界情况；恢复后即可自动化验证 |
| UX-03 | User can perform expression drag/drop (or equivalent documented interaction) with behavior consistent with component documentation | drag-drop.test.ts 覆盖 reorder、plain text 不变、invalid payload；恢复后即可自动化验证 |

</phase_requirements>

## Root Cause Analysis

### 已确认事实

| 项目 | 证据 |
|------|------|
| 删除提交 | `git show cad4e75b --stat` 显示 4 个测试文件被删除 |
| 删除前状态 | 8e4557e7 时 4 个文件存在，`bun run test:phase5` 通过 23 个测试 |
| 当前状态 | `__test__/` 目录不存在，`bun run test:phase5` 返回 exit code 1，No test files found |
| package.json | test:phase5 脚本指向的 4 个路径正确，但目标文件不存在 |

### 需恢复的文件

| 文件 | 用途 | 来源 commit |
|------|------|-------------|
| `ui/components/expression-editor/__test__/architecture-compatibility.test.ts` | ARCH-02 导出/props/emits 兼容性闸门 | 81ce7872 |
| `ui/components/expression-editor/__test__/architecture-boundaries.test.ts` | ARCH-01 sync/insertion/drag-drop/command packs 边界 | 6d75296e |
| `ui/components/expression-editor/__test__/parser.test.ts` | STAB-03 parse/serialize round-trip | 02-03 创建，05-03 补强 |
| `ui/components/expression-editor/__test__/drag-drop.test.ts` | UX-03 拖拽行为回归 | 04-01 创建，05-03 补强 |

### 兼容性验证

当前代码库与 8e4557e7 时的测试契约兼容：

- `createExpressionEditorRuntime`、`registerCommandPacks`、`insertVariableAtTrigger`、`reorderVariable`、`moveVariableByDirection` 均存在于 `internal/` 对应模块
- `parseContent`、`VariableNode` 存在于 `parser.ts`、`nodes/variable-node.tsx`
- `use-expression-drag-drop` 仍导出 `reorderVariableNode`、`collectVariableNodeDescriptors`、`applyDropReorder` 等
- `@ui/types` 的 `ExpressionEditorProps`、`ExpressionEditorEmits`、`VariableItem` 定义未变

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^4.0.18 | 单元/回归测试 | 项目已采用，与 Vite 集成良好 |
| @vitejs/plugin-vue | ^6.0.4 | .vue 模块解析 | 测试中导入 expression-editor 需要 |
| vue | ^3.5.29 | devDep | createExpressionEditorRuntime 等使用 ref/shallowRef |

### 现有配置

- `vitest.config.ts`：已配置 `plugins: [vue()]`、`test.globals: true`
- `package.json`：`test:phase5` 脚本已指向 4 个测试文件路径
- 需确认：vitest 是否配置 `resolve.alias` 以解析 `@ui`（architecture-compatibility 使用 `import from '@ui/types'`）

## Architecture Patterns

### 测试目录结构

```
ui/components/expression-editor/
├── __test__/
│   ├── architecture-compatibility.test.ts   # ARCH-02
│   ├── architecture-boundaries.test.ts     # ARCH-01
│   ├── parser.test.ts                       # STAB-03
│   └── drag-drop.test.ts                    # UX-03
├── expression-editor.vue
├── index.ts
└── internal/
    └── ...
```

### 恢复模式

**What:** 从 git 历史恢复已删除文件，而非重写
**When to use:** 文件曾被提交、随后被误删，且当前实现与历史版本兼容
**Example:**

```bash
# 创建目录
mkdir -p ui/components/expression-editor/__test__

# 从 8e4557e7 恢复（该 commit 包含全部 4 个文件的最终版本）
git show 8e4557e7:ui/components/expression-editor/__test__/architecture-compatibility.test.ts > ui/components/expression-editor/__test__/architecture-compatibility.test.ts
git show 8e4557e7:ui/components/expression-editor/__test__/architecture-boundaries.test.ts > ui/components/expression-editor/__test__/architecture-boundaries.test.ts
git show 8e4557e7:ui/components/expression-editor/__test__/parser.test.ts > ui/components/expression-editor/__test__/parser.test.ts
git show 8e4557e7:ui/components/expression-editor/__test__/drag-drop.test.ts > ui/components/expression-editor/__test__/drag-drop.test.ts
```

### Anti-Patterns to Avoid

- **重写测试逻辑：** 05-03 已设计并验证的断言应直接恢复，避免引入新差异
- **修改 test:phase5 脚本路径：** 路径正确，问题在于文件缺失，而非脚本错误
- **在恢复前修改 vitest 配置：** 先恢复文件并运行，若 `@ui` 解析失败再补 alias

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 恢复已删除的测试文件 | 手动重写测试用例 | `git show <commit>:<path>` 恢复 | 05-03 已设计并验证的断言，重写易引入偏差 |
| @ui 路径解析 | 自定义 resolver | Vite resolve.alias | 项目已有 @ui 约定，vitest 继承 Vite 配置 |

**Key insight:** Phase 5 的测试是经过验证的契约；恢复比重写更安全、更可预测。

## Common Pitfalls

### Pitfall 1: 恢复后 @ui 解析失败

**What goes wrong:** architecture-compatibility.test.ts 中 `import from '@ui/types'` 报错
**Why it happens:** 根目录 vitest.config.ts 未配置 resolve.alias，Vite 默认不解析 tsconfig paths
**How to avoid:** 若恢复后运行失败，在 vitest.config.ts 添加：

```typescript
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@ui': path.resolve(__dirname, 'ui') }
  },
  test: { globals: true }
})
```

**Warning signs:** 报错 "Cannot find module '@ui/types'"

### Pitfall 2: vi.mock 路径错误

**What goes wrong:** `vi.mock('../../tag')` 找不到模块
**Why it happens:** 从 `__test__/` 出发，`../../tag` 指向 `ui/components/tag`，该路径存在
**How to avoid:** 保持原有 mock 路径不变
**Warning signs:** 若未来 tag 组件移动，需同步更新 mock 路径

### Pitfall 3: 再次误删

**What goes wrong:** 恢复后某次 "chore" 提交再次删除测试文件
**Why it happens:** 批量操作或 .gitignore 误配
**How to avoid:** 在 CI 中固化 `bun run test:phase5` 作为 gate；恢复后立即提交并推送到远程
**Warning signs:** 本地通过但 CI 未配置该命令

## Code Examples

### 恢复并验证流程

```bash
# 1. 恢复文件
mkdir -p ui/components/expression-editor/__test__
for f in architecture-compatibility architecture-boundaries parser drag-drop; do
  git show 8e4557e7:ui/components/expression-editor/__test__/${f}.test.ts > ui/components/expression-editor/__test__/${f}.test.ts
done

# 2. 运行回归
bun run test:phase5

# 3. 若 @ui 解析失败，在 vitest.config.ts 添加 resolve.alias 后重试
```

### 验证成功标准

- `bun run test:phase5` exit code 0
- 输出包含 "Tests" 通过数量（预期约 23 个）
- 无 "No test files found" 错误

## Risks and Constraints

| 风险 | 缓解措施 |
|------|----------|
| 8e4557e7 之后 expression-editor 有破坏性改动 | 已验证：internal/、parser、use-expression-drag-drop 与测试契约兼容 |
| vitest 版本升级导致行为变化 | 保持 ^4.0.18，与 05-03 一致 |
| CI 未配置 test:phase5 | Phase 6 完成后建议在 CI 中添加该 gate |

## Open Questions

1. **vitest.config 是否已有 @ui alias？**
   - What we know: 当前 vitest.config.ts 仅配置 plugins 和 globals
   - What's unclear: 05-03 执行时是否通过其他方式（如继承 sample 的 vite 配置）解析 @ui
   - Recommendation: 恢复后先运行，若失败再添加 alias

2. **是否需要在 CI 中固化 test:phase5？**
   - What we know: 成功标准要求 "Regression gate evidence is reproducible in CI/local"
   - What's unclear: 现有 CI 配置是否已包含该命令
   - Recommendation: Phase 6 以本地可重复为首要目标；CI 集成可作为后续任务

## Sources

### Primary (HIGH confidence)

- Git history: `git show cad4e75b`, `git show 8e4557e7` — 根因与恢复来源
- `.planning/v0.5.0-MILESTONE-AUDIT.md` — INT-01、FLOW-01 证据
- `.planning/phases/05-architecture-refactor/05-03-PLAN.md` — 测试设计意图
- `.planning/phases/05-architecture-refactor/05-03-SUMMARY.md` — 23 tests、文件列表

### Secondary (MEDIUM confidence)

- 当前 `ui/components/expression-editor/` 代码结构 — 兼容性验证

## Metadata

**Confidence breakdown:**
- Root cause: HIGH — git history 明确
- Restore strategy: HIGH — 文件可完整恢复，契约兼容
- Vitest alias: MEDIUM — 需运行验证

**Research date:** 2026-02-26
**Valid until:** 30 days（测试基础设施稳定）
