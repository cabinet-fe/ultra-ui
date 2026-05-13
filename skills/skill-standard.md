# 组件技能文档编写规范

编写和更新 `skills/veltra-ui/packages/desktop/components/<name>.md` 时必须遵循本规范。

## 章节结构

章节按以下顺序组织，**不允许增删章节**：

1. `# UComponentName — 一句话描述` — 组件名 + 简短说明（含类型导入提示）
2. `## Import` — 导入语句
3. `## Props` — 属性表
4. `## Emits` — 事件表（无事件也需保留，写「无」）
5. `## Slots` — 插槽表（无插槽也需保留，写「无」）
6. `## Exposed` — 暴露的方法/属性
7. `## Examples` — 代码示例（三级标题 `### xxx`）

**禁止的章节**：禁止生成与组件使用无关的章节（如 CSS 变量、实现原理、开发注意事项等）。文档聚焦于使用者视角的 API 参考。

**特殊组件的额外章节**：

- 仅当组件包含子组件（如 `UCollapseItem`、`UMenuItem`）时，可在 Examples 之前增加子组件的 `## UChildName Props/Slots` 章节
- 仅当组件有大量关联类型（如 `TableColumn`）时，可在 Import 之后增加 `## 关联类型` 章节

## Import 章节写法

`@veltra/vite` 提供了 `VeltraDesktopUIResolver` 用于自动导入组件，我们推荐使用，这样模板中使用 `U` 前缀组件时就无需手动 import。Import 章节只列出需要手动导入的类型和工具函数。

### 组件导入

```md
## Import

\`\`\`ts
// UComponentName 由 Vite 自动导入，无需手动 import
import { FormModel, formField } from '@veltra/desktop'
\`\`\`
```

### 类型导入

类型导入统一放在文件顶部 `>` 引用块中，不占用 Import 章节：

```md
> `import type { XxxProps, XxxEmits, XxxExposed } from '@veltra/desktop'`
```

## Examples 中的导入语句规范

由于 `U` 前缀组件由 Vite 自动导入，示例中**不需要**写组件 import，只写必需的工具函数和类型：

```ts
// ✅ 正确 — 组件自动导入，只 import 工具函数和类型
import { FormModel, formField } from '@veltra/desktop'
import { shallowRef } from 'vue'
import { type Dater } from '@cat-kit/core'

// ❌ 错误 — 手动 import 组件（自动导入已处理，重复引入可能冲突）
import { UInput } from '@veltra/desktop'
```

## 表单类组件在 UForm 中的示例规范

### 核心规则

Veltra UI 的 `UForm` 会**自动**检测 slot 中有 `field` 属性的子组件，自动包裹 `<u-form-item>` 并绑定 `model.data[field]`。因此：

1. **不需要**手写 `<u-form-item>`
2. **不需要** `v-model`
3. model **必须**是 `FormModel` 或 `DynamicFormModel`，**禁止**使用 `reactive({})`

### formField 的使用

- 当 `value` 有值时，字段类型自动推导，**不需要** `formField()`
- `formField()` 仅用于没有初始值的字段，用来显式指定类型

### 固定模板

```vue
### 在 UForm 中使用 > 参考 [form.md](form.md) 了解 FormModel 的完整用法。表单内不需要手写
`u-form-item` 和 `v-model`。 \`\`\`vue
<script setup lang="ts">
import { FormModel } from '@veltra/desktop'

const model = new FormModel({ fieldName: '默认值' })
</script>

<template>
  <u-form :model="model">
    <!-- 替换为真实组件 -->
    <u-component-name label="标签" field="fieldName" />
  </u-form>
</template>
\`\`\`
```

### 不需要表单示例的情况

以下组件**不需要**「在 UForm 中使用」示例：

- 非表单控件类组件（Button、Dialog、Menu、Tabs 等）
- 已通过 `radio-group` / `checkbox-group` 等形式提供表单用法的组件

### 示例数据

- label 使用中文，选项数据使用 `label`/`value` 默认字段名
- 无需在示例中显式声明 `value-key="value" label-key="label"`（这是组件默认值）
- 示例数据以展示用法为原则，最小化数据量（如选项列表 2-3 条即可）

## Props / Emits / Slots 表格规范

- 使用 Markdown 表格，`prop` / `event` / `slot` 用反引号包裹
- `type` 列使用 TypeScript 类型语法
- `default` 列：无默认值时写 `—`
- 继承自父类型的属性应注明来源（如「继承自 `FormComponentProps`」），可分组列出
