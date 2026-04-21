---
name: ac-workflow
description: 基于协议的、简洁高效的代理上下文工作流。当提及初始化、计划、重构、重新计划、上下文工作流、规划、实现、优化、补丁、快速实现时使用。
metadata:
  version: 2.0.0
---


# 代理上下文工作流（ac-workflow）

严格基于`references`中的文件作为开发工作流协议：

- **init**: 初始化项目上下文，根据新项目或旧项目有不同的处理流程。
- **plan**：给需求出计划、拆分任务。
- **replan**：重做计划、调整方案。
- **implement**：按计划开始做、实现当前计划。
- **rush**：快速出计划并实施， 等于 `plan` + `implement` 的连续执行。
- **patch**：实施后不满意、追加需求、修补问题。
- **review**：审查实施结果。
- **done**：任务彻底完成、归档当前计划。

## 最高守则

### 第一步：获取上下文（强制，不可跳过）

**在执行任何协议或决策之前**，必须先在 shell 中运行以下脚本获取上下文快照：

```sh
node <SKILL_DIR>/scripts/get-context-info.js
```

其中 `<SKILL_DIR>` 是本 SKILL.md 文件所在的目录路径。

脚本输出 JSON，包含以下关键字段（后续协议步骤直接引用这些值，禁止自行探索文件系统来获取）：

| 字段 | 含义 |
|------|------|
| `scope` | 当前作用域名称 |
| `currentPlanStatus` | 当前计划状态：`"未执行"` / `"已执行"` / `null`（无计划） |
| `currentPlanNumber` | 当前计划编号（无计划时为 `null`） |
| `currentPlanDir` | 当前计划目录路径（无计划时为 `null`） |
| `currentPlanFile` | 当前计划文件路径（无计划时为 `null`） |
| `nextPlanNumber` | 下一个可用的计划编号 |
| `nextPatchNumber` | 下一个可用的补丁编号（无计划时为 `null`） |

> **此步骤是一切操作的前提。** 不执行脚本 → 不进入任何协议。脚本报错 → 根据错误信息修正后重新执行，直到成功。

### 第二步：全局校验

在 shell 中运行 `agent-context validate`，若不通过则根据错误信息修正对应内容（如修复状态行格式、补全缺失文件等），修正后重新运行验证，重复直至通过。

### 强制规则

- **协议先行**：选定协议后，**完整**读取 `references/<protocol>.md` 再逐步执行；禁止凭记忆、摘要或猜测跳过协议步骤
- **禁止直接改动**：在 **plan** / **rush** 创建计划之前，不得修改业务代码；代码变更仅在 **implement** 或 **patch** 协议中进行
- **顺序执行**：协议内步骤按编号顺序执行，不跳步、不合并、不并行
- **提问引导规范**：使用 AskUserQuestion 时须遵守 `references/ask-user-question.md`

## 协议选择决策

如果用户明确指定要执行某个协议，退出协议选择决策，直接执行该协议。

> **必须基于脚本输出的 `currentPlanStatus` 确定当前状态，再按下表选择协议。禁止跳过状态判断直接匹配动作。**

### 状态 A：`currentPlanStatus` 为 `null`（无当前计划）

| 用户意图 | 动作 | 协议文件 |
|----------|------|----------|
| 初始化项目上下文、补全 AGENTS.md | init | `references/init.md` |
| 给需求出计划、拆分任务 | plan | `references/plan.md` |
| 快速出计划并实施 | rush | `references/rush.md` |

### 状态 B：`currentPlanStatus` 为 `"未执行"`

| 用户意图 | 动作 | 协议文件 |
|----------|------|----------|
| 按计划开始做、实现当前计划 | implement | `references/implement.md` |
| 重做计划、调整方案 | replan | `references/replan.md` |
| 审查当前计划 | review | `references/review.md` |
| 用户提出新需求且与当前计划**相关** | replan | `references/replan.md` |
| 用户提出新需求且与当前计划**无关** | → AskUserQuestion | 选项：1) 归档当前计划后创建新计划（推荐） 2) 终止操作 |

### 状态 C：`currentPlanStatus` 为 `"已执行"`

| 用户意图 | 动作 | 协议文件 |
|----------|------|----------|
| 实施后不满意、追加需求、修补问题 | patch | `references/patch.md` |
| 审查实施结果 | review | `references/review.md` |
| 任务彻底完成、归档当前计划 | done | 运行 `agent-context done` |
| 用户提出新需求且与当前计划**相关** | patch | `references/patch.md` |
| 用户提出新需求且与当前计划**无关** | → AskUserQuestion | 选项：1) 归档后创建新计划（推荐） 2) 终止操作 |

> **关联性判断**：当用户提出变更需求时，对照当前 `plan.md` 的 `## 目标` 判断关联性。若无法确定 → 通过 AskUserQuestion 让用户确认。

## 全局约束

- 计划状态两态：`未执行`、`已执行`。
- 任意时刻最多一个当前计划：`.agent-context/{scope}/plan-{number}`。
- 计划编号从 1 开始全局递增，不复用。补丁编号在单计划目录内从 1 开始递增，不复用。
- 影响范围（`## 影响范围`）不得包含 `.agent-context/` 目录下的文件。
- 脚本输出中的 `nextPlanNumber` 和 `nextPatchNumber` 是已预计算的值，协议中需要编号时**直接使用**，不得自行扫描目录计算。

## 上下文目录结构

```text
.agent-context/
├── .env               # SCOPE 配置（SCOPE=<name>）
├── .gitignore
└── {scope}/           # 作用域目录（按协作者隔离）
    ├── plan-{N}/      # 当前计划（最多一个）
    │   ├── plan.md
    │   └── patch-{N}.md
    ├── preparing/     # 待执行计划队列
    │   └── plan-{N}/
    └── done/          # 已归档计划
        └── plan-{N}-{YYYYMMDD}/
```
