# 技能文档编写指令

你正在为 AI agent 编写技能文档（skill）。技能的唯一消费者是 AI，目标是让 AI 在宿主项目中**快速生成正确代码**。

## 核心原则（按优先级排序）

1. **可执行性** — 每个 API 必须附带可直接复制到项目中使用的代码片段
2. **规则 > 枚举** — 当参数有规律时，描述生成规则和映射关系；AI 能从规则推导出未列举的用法，但无法可靠遵循长枚举列表
3. **约束前置** — 把"不能做什么"放在"能做什么"前面；AI 更容易遵循显式禁令
4. **最小信息量** — 只写 AI 生成正确代码所需的信息。实现细节、内部架构、构建产物结构一律不写
5. **篇幅硬限** — 单文件不超过 200 行

## 判断标准

写完后用以下问题自检：

- AI 能否仅凭此文档（不看源码）生成正确的组件使用代码？
- 是否存在"看起来全面但 AI 无法据此行动"的内容？删掉它
- 是否存在手动枚举而非规则描述的地方？改为规则 + 典型示例

---

## 一、组件技能文档

适用于 `packages/desktop/components/*.md`。

### 章节顺序（固定，不允许增删）

```
# UComponentName — 一句话描述
## Import
## Props
## Emits
## Slots
## Exposed
## Examples
```

**可选追加章节**（仅在以下条件成立时添加，插入 Examples 之前）：

- 组件含子组件（如 `UCollapseItem`）→ 增加 `## UChildName Props/Slots`
- 组件有大量关联类型（如 `TableColumn`）→ 在 Import 后增加 `## 关联类型`

**禁止的章节**：CSS 变量、实现原理、开发注意事项、设计动机。

### 类型导入

放在标题下方的 `>` 引用块中，不占 Import 章节位置：

```md
> `import type { XxxProps, XxxEmits, XxxExposed } from '@veltra/desktop'`
```

### Import 章节

组件由 `VeltraDesktopUIResolver` 自动导入，Import 章节只列需要手动 import 的类型和工具函数：

```ts
// UComponentName 由 Vite 自动导入，无需手动 import
import { FormModel, formField } from '@veltra/desktop'
```

### Props / Emits / Slots 表格

- Markdown 表格，prop/event/slot 名用反引号
- type 列使用 TypeScript 类型语法
- default 列无默认值写 `—`
- 继承自父类型的属性分组列出并注明来源

### Examples

**导入规则**：示例中不 import 组件（自动导入已处理），只 import 工具函数、类型、图标。

**示例数据**：label 用中文，选项数据用 `label`/`value` 默认字段名，2-3 条即可，不显式声明 `value-key="value" label-key="label"`。

**表单类组件**必须包含「在 UForm 中使用」示例，除非：
- 不是表单控件（Button、Dialog、Menu 等）
- 已通过 group 形式覆盖（radio-group 等）

#### 表单示例固定模式

```vue
<script setup lang="ts">
import { FormModel } from '@veltra/desktop'

const model = new FormModel({ fieldName: '默认值' })
</script>

<template>
  <u-form :model="model">
    <u-component-name label="标签" field="fieldName" />
  </u-form>
</template>
```

关键约束：
- model 必须是 `FormModel` 或 `DynamicFormModel`，禁止 `reactive({})`
- 不写 `<u-form-item>`（UForm 自动包裹有 `field` 属性的子组件）
- 不写 `v-model`（UForm 自动绑定 `model.data[field]`）
- `formField()` 仅在没有初始值时用于显式指定类型

---

## 二、包级技能文档

适用于 `packages/<name>.md`（styles、utils、compositions 等）。

### 目标

AI 不阅读源码即可：正确导入、调用核心 API、推导文档未显式列举的合法用法。

### 结构（按优先级裁剪）

1. **标题 + 一句话定位** — 包名、功能、前置依赖
2. **快速上手** — 最小可用代码，覆盖主路径
3. **核心 API** — 按功能分块，每个 API：导入路径 + 签名/用法 + 示例
4. **辅助 API** — 低频但常用的补充

### 编写要点

**描述「怎么用」而非「里面有什么」：**

```
✅ "在应用入口导入一次即可"
✅ "传入 $namespace 覆盖前缀"
❌ "内部包含 box-sizing 重置、margin 清零、font-family 设置…"
```

**用映射规则替代穷举：**

```scss
// 规则：fn.use-var($basename, $nodes...) → var(--{$namespace}-{$basename}-{$node1}-...)
// 示例：
// Theme.color.primary   → fn.use-var(color, primary)   → var(--u-color-primary)
// Theme.text-color.main → fn.use-var(text-color, main) → var(--u-text-color-main)
```

```
❌ | --u-color-primary | --u-color-success | --u-color-warning | ...
```

**突出高频 API**：识别使用频率最高的 1-2 个 API，给予最详细描述。低频 API 简写。

**代码即文档**：用注释标注输出的代码块优于散文描述。

```scss
// 而非文字解释 "b mixin 生成 BEM block 选择器"
@include m.b(button) { }  // .u-button
```

### 不要写的内容

- 包的内部文件结构或目录组织
- 某功能"具体包含哪些规则"（如 normalize 包含哪些 reset）
- 可从类型定义直接获取的完整字段列表（指向类型文件）
- CSS 变量的完整枚举表
