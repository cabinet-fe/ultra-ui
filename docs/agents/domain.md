# 领域文档 (Domain Docs)

工程技能在探索代码库时如何读取本项目的领域文档。

## 探索代码库前，先阅读以下内容

- 根目录下的 **`CONTEXT.md`**，或
- 根目录下的 **`CONTEXT-MAP.md`**（若存在）— 指向每个 Context 对应的 `CONTEXT.md`。阅读与当前任务相关的每个 Context 文档。
- **`docs/adr/`** — 阅读与将要修改的模块相关的 ADR。在多 Context 仓库中，还需检查 `src/<context>/docs/adr/` 下的 Context 作用域决策。

如果上述文件不存在，**静默继续**。无需强调文件缺失，也无需预先建议创建。`/domain-modeling` 技能（通过 `/grill-with-docs` 和 `/improve-codebase-architecture` 触发）会在术语或决策真正确定时延迟创建它们。

## 目录结构

单 Context 结构（绝大多数仓库）：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多 Context 结构（根目录存在 `CONTEXT-MAP.md`）：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 全局系统级决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 局部 Context 决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用词汇表中的专用术语

当输出涉及领域概念时（在 issue 标题、重构建议、假设说明、测试名称中），必须使用 `CONTEXT.md` 中定义的术语，避免使用词汇表明确排除的同义词。

如果要用的概念尚未收录在词汇表中，说明：要么你在使用项目未采用的新词汇（需重新考量），要么存在真实的概念缺口（记录下来供 `/domain-modeling` 使用）。

## 标注与 ADR 的冲突

如果输出与已有的 ADR 冲突，应明确指出而不是隐式覆盖：

> _与 ADR-0007 (event-sourced orders) 存在冲突 — 但值得重新讨论，因为……_
