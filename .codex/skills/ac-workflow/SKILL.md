---
name: ac-workflow
description: 管理 .agent-context 计划生命周期，按 init、plan、replan、implement、patch、rush、done 协议推进任务。
---


# Agent Context

管理项目中的 `.agent-context/` 计划生命周期。匹配用户意图后，读取对应协议文件（相对于本文件所在目录）严格执行。

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

> **消歧**：存在已执行的当前计划时，用户提出任何变更需求 → 一律走 **patch**，禁止走 plan / rush。

## 全局约束

- 状态机两态：`未执行`、`已执行`。
- 任意时刻最多一个当前计划：`.agent-context/plan-{number}`。
- 多个当前计划 → 拒绝执行，提示恢复单活跃状态。
- 计划编号全局递增，不复用。补丁编号在单计划目录内递增，不复用。

## 目录结构

```text
.agent-context/
├── plan-{N}/          # 当前计划（最多一个）
│   ├── plan.md
│   └── patch-{N}.md
├── preparing/         # 待执行计划队列
│   └── plan-{N}/
└── done/              # 已归档计划
    └── plan-{N}-{YYYYMMDD}/
```

编号规则：扫描全部 `plan-N` 目录取 `max(N)+1`。
