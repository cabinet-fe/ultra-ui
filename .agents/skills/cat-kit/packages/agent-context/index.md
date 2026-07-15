# @cat-kit/agent-context

Node.js CLI：安装 `ac-workflow` Skill，并管理 `.agent-context/` 中的计划状态。**不发布**编程 API。

**版本**：2.0.3  
**可执行文件**：`agent-context`

## 主题

| 主题 | 说明 |
| --- | --- |
| [cli](cli/index.md) | 安装、同步、init、状态与归档命令 |
| [protocols](protocols/index.md) | Skill 协议动作（plan / implement 等） |
| [组合示例](examples.md) | 端到端协作流程 |

## 快速开始

```bash
npm install -g @cat-kit/agent-context
agent-context install --tools cursor
agent-context init
agent-context validate
```

安装后向智能体表达任务意图（如「为某某功能创建计划」），由 Skill 协议驱动；CLI 负责安装与状态操作。
