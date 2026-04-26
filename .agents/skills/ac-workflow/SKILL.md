---
name: ac-workflow
description: >
  在 `.agent-context` 目录管理任务计划的 ac-workflow 协议：规划(plan/rush)、实施(implement)、修补(patch)、重规划(replan)、审查(review)、归档(done)、初始化(init)。当你需要创建/实施/修补/审查/归档一个 agent-context 计划时使用。
metadata:
  version: 2.0.3
---

# ac-workflow

不要预先读取所有协议文件；只在确定动作后读取 `references/<protocol>.md`。

## 启动步骤

执行任何协议前，从项目根目录运行**一条**命令：

```sh
node <SKILL_DIR>/scripts/get-context-info.js
```

`<SKILL_DIR>` 是本 `SKILL.md` 所在目录（不是字面占位符）。脚本输出包含 `scope`、`currentPlanStatus`、`currentPlanNumber`、`currentPlanDir`、`currentPlanFile`、`nextPlanNumber`、`nextPatchNumber` 的 JSON；**内置格式校验**，发现问题时以非 0 退出码打印错误——先按错误修正再重跑到通过。若不在项目根目录，追加 `--cwd <project-root>`。

脚本拉起失败（例如 Node 权限问题）时才回退到 `node <SKILL_DIR>/scripts/validate-context.js` 做独立校验。直接使用脚本输出的字段，不要自行扫描目录推断状态或编号。**特例**：脚本报错 `未找到 .agent-context 目录` 说明项目尚未初始化——直接读取 `references/init.md` 进入初始化协议，不再执行其它路由。

## 目录结构

工作区真实布局，命名严格遵守：

- 当前计划：`.agent-context/{scope}/plan-{number}/`，目录名**只能**是 `plan-{nextPlanNumber}`，禁止追加日期或任何后缀。
- 待执行队列：`.agent-context/{scope}/preparing/plan-{number}/`，命名规则同上。
- 已归档：`.agent-context/{scope}/done/plan-{number}-YYYYMMDD/`，由 `agent-context done` 自动加日期，**禁止手动按此形态创建**。
- 元数据：`.agent-context/{scope}/index.md`、`.agent-context/.env`。

## 路由

确定一个动作后，**完整读取**对应协议文件并按顺序执行。若协议引用其他协议，继续读取被引用文件，不要凭记忆执行。

| 状态 | 用户意图 | 动作 |
| --- | --- | --- |
| `null` | 初始化上下文、补全项目指导文件 | 读 `references/init.md` |
| `null` | 创建计划、拆分需求 | 读 `references/plan.md` |
| 任意 | 用户**明确点名 rush**，或任务单一、范围明确、可一气呵成 | 读 `references/rush.md` |
| `未执行` | 开始执行当前计划 | 读 `references/implement.md` |
| `未执行` | 调整、重做、替换当前计划 | 读 `references/replan.md` |
| `未执行` | 审查计划 | 读 `references/review.md` |
| `已执行` | 修补、补遗漏、追加相关增量 | 读 `references/patch.md` |
| `已执行` | 审查实现 | 读 `references/review.md` |
| `已执行` | 完成并归档 | 运行 `agent-context done --yes` |

用户明确点名 `init`/`plan`/`replan`/`implement`/`patch`/`rush`/`review` 时，同样先完成启动步骤再读对应协议。协议里出现"「交互式提问工具」"时一律按 `references/ask-user-question.md` 执行：**首次提问前先读该文件**，按其"工具识别"步骤**按语义**（工具名或描述含 ask / question / choice / select / prompt / input / followup / clarify 等关键字）在本次会话**自己可调用**的工具清单中定位宿主提问工具；命中任一 → **必须调用**，不得以"优先"、"不方便"为由跳过或改用普通文本回复；真正完全无匹配才回退到一条简短文本问题并暂停，**禁止伪造工具调用**。涉及写业务代码或出方案时，先读 `references/_principles.md` 作为共享专业素养基线。

## 硬约束

- 计划状态只允许 `未执行` 或 `已执行`。
- 任意时刻最多一个当前计划，目录名严格 `plan-{nextPlanNumber}`（不带日期/后缀）；`done/plan-{number}-YYYYMMDD` 仅由 `agent-context done` 生成。
- 创建计划使用 `nextPlanNumber`；创建补丁使用 `nextPatchNumber`。
- 在 `plan` 或 `rush` 创建计划前不改业务代码；代码变更只发生在 `implement` 或 `patch`。
- `## 影响范围` 不记录 `.agent-context/` 内文件。
