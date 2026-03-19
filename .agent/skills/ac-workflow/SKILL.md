---
name: ac-workflow
description: 管理 .agent-context 计划生命周期，按 init、plan、replan、implement、patch、rush、done 协议推进任务。
---


# Agent Context

管理项目中的 `.agent-context/` 计划生命周期。匹配用户意图后，**必须先读取对应协议文件的完整内容**，再严格按协议步骤逐项执行。

## 执行纪律

- **协议先行**：匹配到动作后，必须先读取对应 `actions/*.md` 协议文件的完整内容，再逐步执行。禁止凭记忆、摘要或猜测跳过协议步骤。
- **前置检查必做**：所有动作（done 除外）均包含「前置检查」，必须逐条执行，不可跳过。包括运行 `agent-context validate`。
- **禁止直接改动**：在 plan / rush 创建计划之前，不得直接修改项目代码文件。任何代码变更必须在已创建计划（implement）或已创建补丁（patch）的上下文中进行。
- **顺序执行**：协议步骤必须按编号顺序逐项执行，不可跳步、合并或并行。

## 意图匹配

| 用户意图 | 动作 | 协议文件 |
|----------|------|----------|
| 初始化项目上下文、补全 AGENTS | init | `actions/init.md` |
| 给需求出计划、拆分任务 | plan | `actions/plan.md` |
| 重做计划、调整方案 | replan | `actions/replan.md` |
| 按计划开始做、实现当前计划 | implement | `actions/implement.md` |
| 实施后不满意、追加需求、修补问题 | patch | `actions/patch.md` |
| 无活跃计划时快速出计划并实施 | rush | `actions/rush.md` |
| 任务彻底完成、归档当前计划 | done | 运行 `agent-context done` |

> **消歧**：存在已执行的当前计划时，用户提出变更需求：
> - 需求与当前计划**相关联**或用户本意是修补当前计划 → 走 **patch**。
> - 需求与当前计划**完全无关** → 拒绝执行，提示先运行 `agent-context done` 归档当前计划后再创建新计划。

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
