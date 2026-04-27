# @cat-kit/agent-context

维护 `.agent-context/` 目录下任务计划的 CLI 工具，支持 plan → implement → patch → review → done 完整工作流协议。

## 运行环境

Node.js（CLI + 编程 API）。

## 命令

### `init`

```bash
agent-context init [--scope <name>] [--yes]
```

初始化项目上下文。在 `process.cwd()` 下创建 `.agent-context/` 目录结构。

- `--scope <name>`：手动指定 scope（默认从 `git config user.name` 自动生成）
- `--yes`：非交互模式，直接覆盖已有配置

### `plan` / `implement` / `patch` / `review` / `done`

这些操作通过 AI 代理执行 ac-workflow Skill 协议完成，不由 CLI 直接实现（CLI 只提供 `validate`、`context`、`status`、`done`、`index` 等辅助命令）。

### `done`

```bash
agent-context done [--yes]
```

归档当前已执行计划到 `done/plan-{N}-YYYYMMDD/`。若 preparing 队列有等待计划，自动提升第一个为当前计划。`--yes` 跳过确认。

### `sync`

```bash
agent-context sync [--check]
```

同步 ac-workflow Skill：将 canonical source (`.agents/skills/ac-workflow/`) 刷新到各 AI 工具的兼容入口。`--check` 仅检查差异不写入。

### `prompt-gen`

```bash
agent-context prompt-gen [--tools <tools>] [--profile <profile>] [--yes] [--check]
```

在 `$HOME` 下各 AI 工具全局配置目录生成提示词文件。

支持的工具：`claude`、`codex`、`gemini`、`antigravity`
- `--profile`：提示词模板（`default`、`whj`）
- `--check`：仅预览不写入
- `--yes`：文件已存在时直接覆盖

### `status`

```bash
agent-context status
```

查看当前上下文状态：作用域、当前计划、待执行队列、已归档数量。

### `validate`

```bash
agent-context validate
```

校验 `.agent-context` 目录结构完整性（最多 1 个当前计划、plan.md 存在、状态行格式正确等）。

### `context`

```bash
agent-context context
```

输出当前上下文状态的 JSON 快照（供脚本消费）。

### `index`

```bash
agent-context index
```

生成/更新 `index.md` 计划索引文件。

### `skill-eval`

```bash
agent-context skill-eval
```

评估 ac-workflow Skill 的 `description` 对触发样例的覆盖度。通过关键词匹配验证是否准确触发。

### `install`

```bash
agent-context install [--tools <tools>] [--yes] [--check]
```

安装 ac-workflow Skill 到项目。`--tools` 指定兼容 AI 工具（`claude,codex,cursor,antigravity,agents,gemini,copilot`），不传时仅写 canonical source。

### `upgrade`

```bash
agent-context upgrade
```

检查全局安装的 `@cat-kit/agent-context` 版本并升级到最新。

## 编程 API

```ts
import { AC_ROOT_DIR, PLAN_FILE_NAME } from '@cat-kit/agent-context/dist/constants.js'
```

主要的可编程 API：

```ts
import { readContext, validate, archive, generateIndex } from '@cat-kit/agent-context'

// 读取上下文快照
const context = await readContext()

// 校验结构完整性
const result = validate(context.snapshot, context.currentPlanCount)

// 归档当前计划
const archived = await archive(context)
```

## ac-workflow 协议

安装后，`.agents/skills/ac-workflow/` 包含 7 个协议：`init`、`plan`、`implement`、`patch`、`rush`、`replan`、`review`。AI 代理按 `SKILL.md` 的路由表读取对应协议执行。

> 类型签名：`../../generated/agent-context/cli.d.ts`
