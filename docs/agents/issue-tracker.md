# Issue tracker: 本地 Markdown

本项目的 Issue 与规格说明 (spec) 均作为 Markdown 文件存放在 `.scratch/` 目录下。

## 约定规范

- 每个 feature 独占一个目录：`.scratch/<feature-slug>/`
- Spec 文件路径：`.scratch/<feature-slug>/spec.md`
- 具体 Implementation issue 文件独立存放于 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号 — 严禁合并为单个 tickets 文件
- 分流与分拣状态 (Triage state) 记录在每个 issue 文件顶部的 `Status:` 行
- 讨论与补充记录统一追加到文件底部的 `## Comments` 标题下

## 当技能要求 "publish to the issue tracker" 时

在 `.scratch/<feature-slug>/` 下新建对应的 Issue 文件（若目录不存在则自动创建）。

## 当技能要求 "fetch the relevant ticket" 时

直接读取指定路径的 Issue 文件。

## Wayfinder 操作

供 `/wayfinder` 使用。**Map** 文件对应一个包含多个 **Child** 任务文件的结构。

- **Map**：`.scratch/<effort>/map.md` — 记录 Notes / Decisions-so-far / Fog 内容。
- **Child ticket**：`.scratch/<effort>/issues/NN-<slug>.md`，从 `01` 开始编号。`Type:` 行记录类型（`research`/`prototype`/`grilling`/`task`）；`Status:` 行记录 `claimed`/`resolved`。
- **Blocking**：文件顶部 `Blocked by: NN, NN` 行。当列出的所有 blocker 文件状态均为 `resolved` 时视为解除阻塞。
- **Frontier**：扫描 `.scratch/<effort>/issues/` 寻找未完成、未阻塞且未领取的任务文件；编号最小者优先。
- **Claim**：在开始工作前设置 `Status: claimed` 并保存。
- **Resolve**：在 `## Answer` 标题下追加解答，设置 `Status: resolved`，并将上下文指针（摘要 + 链接）追加至 `map.md` 的 Decisions-so-far 中。
