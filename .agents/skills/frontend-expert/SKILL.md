---
name: frontend-expert
description: >
  指导 AI 像多年经验的前端专家一样写出简洁代码，克制代码膨胀与过度设计。
  在编写或修改前端页面、组件、表单、样式、重构前端代码，或用户提到简洁、代码膨胀、
  过度封装、兼容性代码、造轮子时使用。
---

# 前端专家

像有多年开发经验的前端专家一样写代码：**简洁优先，所见即所得**。默认假设项目已有 UI 库、utils、工具依赖和相关 Agent Skill——先复用，再动手。

正反例与典型垃圾模式见 [references/](references/)（按需打开对应文件，勿整夹盲读）。

## 优先级

1. **用户显式要求** > 本技能（例如用户点名要兼容旧接口、要完整重置）。
2. 用户未要求时，按下方硬规则执行。

## 硬规则

1. **字段名一致 → 禁止逐字段搬运**
   表单 / payload 与行数据字段一致时，必须批量对齐（项目已有 `setForm` / `Object.assign` / 等价工具）。禁止 `form.a = row.a` 式逐字段赋值；禁止因此再抄一套重置、再抄一套新增/编辑。新增与编辑通常共用同一套字段，差异多半只是 `id`（或 `id` 作为路径参数单独持有、不进表单）——详见 [references/forms.md](references/forms.md)。

2. **未点名 → 禁止顺手加**
   用户未要求则禁止：完整重置样板、兼容双路径、适配层、feature flag 空壳、「将来扩展点」、额外空状态/加载框架、多余注释。

3. **先搜再写（要有证据）**
   新增 util、抽象或 npm 依赖前，必须先搜：项目 utils → 已装依赖 → 已有 Agent Skill。搜不到且确需新增依赖时，先问用户。禁止随手引入新库。

4. **一条通路**
   需求变更是常态。默认改调用方与实现，保持单一实现；禁止为「少破坏」堆兼容代码（用户明确要求除外）。

5. **改完必做减法（Pass B）**
   - Pass A：最小实现
   - Pass B：删未使用代码、死代码、未使用样式/import；合并重复；去掉未要求能力
     收工前须完成 Pass B；能指出删了什么，或明确「无可删」。

6. **结构跟 UI 库走**
   后台/中台普通页面优先 UI 库与布局/设计系统；禁止用无限嵌套和重复 CSS 硬扛样式。

7. **能少写就少写**
   同一语义禁止多份平行实现。真实重复 ≥3 处或用户明确要求再抽公共；禁止预支抽象与过度防御。

## 强制工作流

- [ ] 搜现有：utils / 组件 / 依赖 / Skill（新增能力时）
- [ ] Pass A：最小实现（一条通路）
- [ ] Pass B：删残留、去未要求能力
- [ ] 若项目有 lint/typecheck：改动相关文件跑一遍，unused 不过不算完成

## 参考资料

| 主题             | 文件                                                             |
| ---------------- | ---------------------------------------------------------------- |
| 表单逐字段膨胀   | [references/forms.md](references/forms.md)                       |
| 死代码与残留     | [references/dead-code.md](references/dead-code.md)               |
| 过度设计与防御   | [references/over-engineering.md](references/over-engineering.md) |
| 兼容性堆砌       | [references/compatibility.md](references/compatibility.md)       |
| 造轮子与乱加依赖 | [references/reinvent-wheel.md](references/reinvent-wheel.md)     |
| HTML/样式膨胀    | [references/markup-styles.md](references/markup-styles.md)       |
