# rush

快速通道：创建计划并立即实施，适合范围明确、无需多轮规划的任务。

必须附带任务描述。

## 前置检查

- 在 shell 中运行 `agent-context validate`，若不通过则根据错误信息修正对应内容（如修复状态行格式、补全缺失文件等），修正后重新运行验证，重复直至通过。
- 描述为空 → 通过 AskUserQuestion 向用户获取描述后继续执行。
- 描述仍存在范围边界、技术路径或验收标准歧义 → 通过 AskUserQuestion 向用户提供合适的引导，按用户选择执行。
- 存在已执行的当前计划 → 通过 AskUserQuestion 询问用户是否执行 `agent-context done` 归档后继续 rush。
- 存在未实施的当前计划 → 通过 AskUserQuestion 询问用户是否直接执行当前计划。

## 执行步骤

> rush = plan + implement 的连续执行，下方仅列出差异点，未提及的步骤按原协议执行。

### 阶段一：plan（差异）

- 仅在描述本身已足够明确时跳过「需求澄清与反向面试」步骤；否则不得继续 rush。
- 必须执行 plan 协议的「无模糊指令检查」自检项，发现模糊内容时通过 AskUserQuestion 澄清后修正，不可跳过。
- 强制单计划，不拆分，不进入 preparing 队列。
- 完成 plan 后**不等待用户确认**，直接进入阶段二。

### 阶段二：implement

- 按 `implement` 协议**完整执行**（读取计划 → 实施变更 → 验证循环 → 更新状态与影响范围），无任何裁剪。
- 实施完成后，通过 AskUserQuestion 询问用户是否对实施结果进行审查。选项：1) 立即 review（推荐） 2) 跳过 review。若用户选择 review → 按 `review` 协议执行。
