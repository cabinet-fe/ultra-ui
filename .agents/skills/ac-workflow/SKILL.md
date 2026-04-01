---
name: ac-workflow
description: 管理 .agent-context 计划生命周期，按 init、plan、replan、implement、patch、rush、review、done 协议推进任务。
argument-hint: [request]
---


# Agent Context

管理项目中的 `.agent-context/` 计划生命周期。**每次交互**必须先判断当前计划状态，再按路由表选择动作，最后读取对应协议文件完整内容并逐步执行。

## 执行纪律

- **状态先查**：任何操作前，必须先读取 `.agent-context/{scope}/` 目录，确定当前计划状态（无计划 / 未执行 / 已执行）。此步骤不可跳过。
- **协议先行**：匹配到动作后，必须先读取对应 `actions/*.md` 协议文件的完整内容，再逐步执行。禁止凭记忆、摘要或猜测跳过协议步骤。
- **前置检查必做**：所有动作（done 除外）均包含「前置检查」，必须逐条执行，不可跳过。凡协议写明需运行 `agent-context validate` 时必须执行；`init` 在首次初始化且 `.agent-context/` 尚不存在时，先确认初始化场景成立，再按协议继续。
- **禁止直接改动**：在 plan / rush 创建计划之前，不得直接修改项目代码文件。任何代码变更必须在已创建计划（implement）或已创建补丁（patch）的上下文中进行。
- **顺序执行**：协议步骤必须按编号顺序逐项执行，不可跳步、合并或并行。

## 路由决策

> **必须先确定当前计划状态，再按下表选择动作。禁止跳过状态判断直接匹配动作。**

### 状态 A：无当前计划

| 用户意图 | 动作 | 协议文件 |
|----------|------|----------|
| 初始化项目上下文、补全 AGENTS.md | init | `actions/init.md` |
| 给需求出计划、拆分任务 | plan | `actions/plan.md` |
| 快速出计划并实施 | rush | `actions/rush.md` |

### 状态 B：当前计划状态为「未执行」

| 用户意图 | 动作 | 协议文件 |
|----------|------|----------|
| 按计划开始做、实现当前计划 | implement | `actions/implement.md` |
| 重做计划、调整方案 | replan | `actions/replan.md` |
| 审查当前计划 | review | `actions/review.md` |
| 用户提出新需求且与当前计划**相关** | replan | `actions/replan.md` |
| 用户提出新需求且与当前计划**无关** | → AskUserQuestion | 选项：1) 归档当前计划后创建新计划（推荐） 2) 终止操作 |

### 状态 C：当前计划状态为「已执行」

| 用户意图 | 动作 | 协议文件 |
|----------|------|----------|
| 实施后不满意、追加需求、修补问题 | patch | `actions/patch.md` |
| 审查实施结果 | review | `actions/review.md` |
| 任务彻底完成、归档当前计划 | done | 运行 `agent-context done` |
| 用户提出新需求且与当前计划**相关** | patch | `actions/patch.md` |
| 用户提出新需求且与当前计划**无关** | → AskUserQuestion | 选项：1) 归档后创建新计划（推荐） 2) 终止操作 |

> **关联性判断**：当用户提出变更需求时，对照当前 `plan.md` 的 `## 目标` 判断关联性。若无法确定 → 通过 AskUserQuestion 让用户确认。

## 全局约束

- 状态机两态：`未执行`、`已执行`。
- 任意时刻最多一个当前计划：`.agent-context/{scope}/plan-{number}`。
- 多个当前计划 → 拒绝执行，提示恢复单活跃状态。
- 计划编号全局递增，不复用。补丁编号在单计划目录内递增，不复用。
- 影响范围（`## 影响范围`）不得包含 `.agent-context/` 目录下的文件。

## 目录结构

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

编号规则：在当前 scope 内扫描全部 `plan-N` 目录取 `max(N)+1`。

## AskUserQuestion 规范

所有协议在通过 **AskUserQuestion** 向用户提问时必须遵守：

- 提问通俗易懂，不废话
- 单选选项须标注推荐项并说明理由
- 选项编号使用从 1 开始的正整数

