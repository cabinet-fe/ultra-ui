# 技能文档编写指令

你正在为 AI agent 编写技能文档（skill）。技能的唯一消费者是 AI，目标是让 AI 在宿主项目中**快速生成正确代码**。

## 核心原则（按优先级排序）

1. **可执行性** — 每个 API 必须附带可直接复制到项目中使用的代码片段
2. **规则 > 枚举** — 当参数有规律时，描述生成规则和映射关系；AI 能从规则推导出未列举的用法，但无法可靠遵循长枚举列表
3. **约束前置** — 把"不能做什么"放在"能做什么"前面；AI 更容易遵循显式禁令
4. **最小信息量** — 只写 AI 生成正确代码所需的信息。实现细节、内部架构、构建产物结构一律不写
5. **篇幅硬限** — 单文件 `api.md` 不超过 200 行

## 判断标准

写完后用以下问题自检：

- AI 能否仅凭此文档（不看源码）生成正确的组件使用代码？
- 是否存在"看起来全面但 AI 无法据此行动"的内容？删掉它
- 是否存在手动枚举而非规则描述的地方？改为规则 + 典型示例
- Props/Emits/Slots/Exposed 是否与 `generated/types/` 重复？删掉表格，改指向类型文件

---

## 一、组件技能文档

适用于 `packages/desktop/components/{name}/`。

### 目录结构（固定）

```
components/{name}/
  api.md        ← 用法约定 + 伴生 API + 关联类型（不重复 Props 表格）
  examples.md   ← 可复制的示例代码
```

### api.md 章节顺序

```
# UComponentName — 一句话描述
> 类型：`../../../generated/types/{name}.ts`
> `import type { ... } from '@veltra/desktop'`

## Import
## {伴生 API 名称} 函数式 API   ← 如有 message / Notification / FormModel 等
## 关联类型                      ← 如有 TableColumn、ContextMenuItem 等复杂类型
## {子组件名}                     ← 仅保留 slot/用法说明，不写 Props 表格
```

**禁止的章节**：与 `generated/types/{name}.ts` 重复的 Props/Emits/Slots/Exposed 表格、`## Examples`。

主文档末尾：

```md
> 示例见 [examples.md](./examples.md)
```

### 类型导入

放在标题下方的 `>` 引用块中，不占 Import 章节位置：

```md
> `import type { XxxProps, XxxEmits, XxxExposed } from '@veltra/desktop'`
> 类型：`../../../generated/types/button.ts`
```

### Import 章节

组件由 `VeltraDesktopUIResolver` 自动导入，Import 章节只列需要手动 import 的函数、类型、图标：

```ts
// UComponentName 由 Vite 自动导入，无需手动 import
import { FormModel, formField } from '@veltra/desktop'
```

### 伴生 API（必须单独成节）

以下模式必须在 `api.md` 用独立 `##` 章节说明，不可只写在示例里：

| 组件目录        | 伴生 API                                              |
| --------------- | ----------------------------------------------------- |
| `message`       | `message()` 函数式 API                                |
| `message-confirm` | `MessageConfirm()` 及快捷方法                       |
| `notification`  | `Notification()` 函数式 API                           |
| `context-menu`  | `contextmenu.pop()`                                   |
| `form`          | `FormModel` / `DynamicFormModel` / `formField` 等   |
| `table`         | `defineTableColumns()`                                |

继承/扩展其他组件 Props 时（如 `batch-edit`），用 `## Props（专属）` / `## Emits（专属）` 只写**增量**字段，并指向被继承组件的 `api.md`。

### 示例文件（`examples.md`）

**文件结构（固定）**：

```md
# UComponentName 示例

## 简短动作短语

​```vue
<!-- 可直接复制的示例代码 -->
​```
```

**硬规则**：

- 每个示例 = 一个 `##` 标题（简短动作短语）+ **紧跟**恰好一段代码块；标题与代码之间不写散文
- 极少数必要约束（如"需配 FormModel"）允许标题下一行一句话，但默认零散文
- 同一场景有多段代码时，拆成多个 `##` 标题，禁止一个标题下堆多个代码块
- 示例代码沿用下方约定；单文件不设行数硬限

**导入规则**：示例中不 import 组件（自动导入已处理），只 import 工具函数、类型、图标。

**示例数据**：label 用中文，选项数据用 `label`/`value` 默认字段名，2-3 条即可。

**表单类组件**必须包含「在 UForm 中使用」示例，除非不是表单控件或已通过 group 形式覆盖。

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
```

**突出高频 API**：识别使用频率最高的 1-2 个 API，给予最详细描述。低频 API 简写。

**代码即文档**：用注释标注输出的代码块优于散文描述。

### 不要写的内容

- 包的内部文件结构或目录组织
- 某功能"具体包含哪些规则"（如 normalize 包含哪些 reset）
- 可从 `generated/types/` 或类型定义直接获取的完整 Props 字段列表
- CSS 变量的完整枚举表
