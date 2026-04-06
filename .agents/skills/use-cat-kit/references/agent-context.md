# @cat-kit/agent-context

ac-workflow CLI 与 Skill，管理 `.agent-context/` 计划目录，让 AI 工具围绕统一计划协作。

## 目录

- [目录结构](#目录结构)
- [生命周期](#生命周期)
- [CLI 命令](#cli-命令)
- [Action 说明](#action-说明)
- [协作场景](#协作场景)

---

## 目录结构

```text
.agent-context/
├── .env               # SCOPE=<name>
├── .gitignore
└── {scope}/
    ├── index.md       # 计划索引（自动生成）
    ├── plan-{N}/      # 当前计划（最多一个）
    │   ├── plan.md
    │   └── patch-{N}.md
    ├── preparing/     # 待执行计划队列
    │   └── plan-{N}/
    └── done/          # 已归档计划
        └── plan-{N}-{YYYYMMDD}/
```

---

## 生命周期

```text
init → plan → implement → patch(可多次) → done
init → rush → done
plan → replan → implement
review(任何有计划时) → replan 或 patch
```

计划只有两个状态：`未执行` 和 `已执行`。每个 SCOPE 最多一个当前计划。

---

## CLI 命令

| 命令 | 说明 |
|---|---|
| `agent-context init [--scope <name>] [--yes]` | 初始化 SCOPE |
| `agent-context install [--tools <tools>] [--check] [--yes]` | 安装 Skill 到 AI 工具 |
| `agent-context sync [--tools <tools>] [--check]` | 同步已安装 Skill |
| `agent-context validate` | 校验目录结构 |
| `agent-context status` | 查看当前状态 |
| `agent-context done [--yes]` | 归档当前已执行计划 |
| `agent-context index` | 生成/更新计划索引 |
| `agent-context prompt-gen [--tools <tools>] [--yes] [--check]` | 写入全局提示词模板 |
| `agent-context upgrade` | 升级 CLI 到最新版本 |

支持的 `--tools`：claude, codex, cursor, copilot, gemini, antigravity（逗号分隔）。

---

## Action 说明

Action 是在对话中说出的动作意图，不是 CLI 子命令。

| Action | 适用时机 | 前置状态 |
|---|---|---|
| `init` | 项目还没有协作规则 | 无 |
| `plan` | 新需求需要拆步骤 | 无冲突的当前计划 |
| `replan` | 计划未执行但方案要改 | 目标计划 `未执行` |
| `implement` | 开始实施当前计划 | 当前计划 `未执行` |
| `patch` | 已执行计划上补修复 | 当前计划 `已执行` |
| `rush` | 任务明确，直接做 | 无未实施当前计划 |
| `review` | 独立第三方审查 | 当前计划存在 |
| `done` | 归档完成的计划 | 当前计划 `已执行` |

关键规则：
- `implement` 不接受附加需求
- `patch` 生成 `patch-{N}.md` 并更新影响范围
- `rush` = `plan` + `implement` 连续执行
- `review` 不接受额外描述，使用独立子代理

---

## 协作场景

1. **中等功能开发**：`plan` → 审阅 → `implement` → `patch`(如需) → `done`
2. **推翻重来**：`replan`（仅未执行计划）
3. **小任务快速完成**：`rush`
4. **已执行后补修**：`patch`（不要重新 plan）
5. **正式收尾**：`done`（自动归档 + 晋升下一个 preparing 计划）
6. **多人协作**：各自独立 SCOPE，`agent-context init` 初始化
7. **独立审查**：`review`（未执行→通常 replan，已执行→通常 patch）
