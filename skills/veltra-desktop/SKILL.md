---
name: veltra-desktop
description: >
  @veltra/desktop 组件库的完整接口文档与使用示例（71 个组件）。
  包含 Props/Emits/Exposed 类型定义和 playground 真实代码。
  当开发页面涉及 UI 组件、表单、表格、对话框、选择器、树组件、消息通知、
  编辑器、导航菜单等桌面端组件时使用。
  按分类读取 generated/ 下的对应文件获取类型和示例。
---

# veltra-desktop

## 分类概览

| 分类 | 数量 | generated 文件 | 组件举例 |
|------|------|----------------|----------|
| 表单 | 25 | [form.md](generated/form.md) | form, input, select, date-picker, checkbox |
| 数据展示 | 12 | [data-display.md](generated/data-display.md) | table, tree, list, paginator, tag |
| 反馈通知 | 10 | [feedback.md](generated/feedback.md) | message, dialog, drawer, loading, tip |
| 导航 | 7 | [navigation.md](generated/navigation.md) | menu, tabs, breadcrumb, dropdown |
| 布局容器 | 4 | [layout.md](generated/layout.md) | layout, card, scroll, watermark |
| 编辑器 | 6 | [editor.md](generated/editor.md) | code-editor, rich-text-editor, table-editor |
| 通用 | 7 | [general.md](generated/general.md) | button, icon, action, check-tag |

完整 71 组件目录：[catalog.md](generated/catalog.md)
共享类型（animation, css-transition, pop 等）：[shared-types.md](generated/shared-types.md)

## 导入约定

### 自动按需导入（推荐）

playground 通过 `unplugin-components` 配置了 `U` 前缀自动解析。模板中直接使用：

```vue
<u-button type="primary">确认</u-button>
<UButton type="primary">确认</UButton>
```

两种写法等价，resolver 同时引入组件对应的 `style.ts` 副作用。

### 手动导入

```typescript
// 类型
import type { ButtonProps, TableColumn, FormExposed } from '@veltra/desktop'

// 工具类/函数
import { FormModel, DynamicFormModel, defineTableColumns, message } from '@veltra/desktop'

// 图标（独立包）
import { Edit, Delete, Search } from '@veltra/icons/normal'
```

## 核心开发模式

### v-model 双向绑定

所有表单组件支持 `v-model`（语法糖 `modelValue` + `update:modelValue`）：

```vue
<u-input v-model="name" />
<u-select v-model="selected" :options="options" />
<u-switch v-model="enabled" />
```

### 表单集成（FormModel）

`FormModel` 封装表单数据与校验规则，配合 `<u-form>` 的 `field` 属性自动绑定：

```typescript
const model = new FormModel({
  name: { required: true },
  age: { min: 0, max: 150 },
  email: { match: [/^\w+@\w+\.\w+/, '邮箱格式不正确'] },
  phone: {
    validator(value) {
      return /^1\d{10}$/.test(value) ? '' : '手机号格式不正确'
    }
  }
})
```

```vue
<u-form :model="model" label-width="100px">
  <u-input field="name" label="姓名" />
  <u-number-input field="age" label="年龄" suffix="岁" />
  <u-select field="unit" label="单位" :options="units" />
</u-form>
```

关键 API：`model.validate()`, `model.resetData()`, `model.setData()`, `model.clearValidate()`

### 插槽

作用域插槽访问行/列/节点数据：

```vue
<!-- 表格列自定义 -->
<u-table :data="rows" :columns="columns">
  <template #column:action>
    <u-action-group :max="4">
      <u-action need-confirm type="danger">删除</u-action>
    </u-action-group>
  </template>
</u-table>

<!-- 树节点自定义 -->
<u-tree :data="data" label-key="name" value-key="id">
  <template #default="{ data }">{{ data.name }} - {{ data.id }}</template>
</u-tree>
```

### 事件约定

- `update:modelValue` — v-model 绑定值变更
- `update:checked` — 勾选状态变更（table, tree）
- `update:selected` — 选中状态变更（tree）
- 组件特有事件参见各组件类型定义中的 `Emits` 接口

### 组件 ref（Exposed）

通过 `shallowRef` + Exposed 类型访问组件实例方法：

```typescript
import type { TreeExposed, FormExposed } from '@veltra/desktop'

const treeRef = shallowRef<TreeExposed>()
// treeRef.value?.filter(keyword)

const formRef = shallowRef<FormExposed>()
// formRef.value?.el
```

## 渐进式引导

### Level 1：基础组件

```vue
<u-button type="primary" :loading="saving" @click="save">保存</u-button>
<u-tag type="success">已通过</u-tag>
<u-icon :size="20"><Edit /></u-icon>
```

### Level 2：表单组件

```vue
<script setup lang="ts">
import { FormModel } from '@veltra/desktop'

const model = new FormModel({
  name: { required: true, value: '' },
  category: { required: true }
})

async function handleSubmit() {
  const valid = await model.validate()
  if (!valid) return
  await api.save(model.data)
}
</script>

<template>
  <u-form :model="model">
    <u-input field="name" label="名称" />
    <u-select field="category" label="分类" :options="categories" />
    <template #footer>
      <u-button type="primary" @click="handleSubmit">提交</u-button>
      <u-button @click="model.resetData()">重置</u-button>
    </template>
  </u-form>
</template>
```

### Level 3：数据组件

```vue
<script setup lang="ts">
import { defineTableColumns } from '@veltra/desktop'
import { shallowRef } from 'vue'

const checked = shallowRef([])
const columns = defineTableColumns([
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄', align: 'center' },
  { key: 'action', name: '操作', align: 'center' }
])
</script>

<template>
  <u-table :data="rows" :columns="columns" v-model:checked="checked" checkable show-index>
    <template #column:action>
      <u-action-group :max="3">
        <u-action>编辑</u-action>
        <u-action need-confirm type="danger">删除</u-action>
      </u-action-group>
    </template>
  </u-table>
  <u-paginator :total="total" v-model:page="page" v-model:page-size="pageSize" />
</template>
```

### Level 4：编辑器组件

编辑器组件接口较复杂，参阅 [editor.md](generated/editor.md) 中的类型定义与示例。

## 使用方式

1. **按需查阅**：先看 [catalog.md](generated/catalog.md) 定位组件分类，再打开对应分类文件
2. **类型优先**：每个组件的 Props/Emits/Exposed 定义在分类文件的"类型定义"部分
3. **示例参考**：playground 示例展示真实用法，直接参考或适配

## 参考文件索引

| 路径 | 内容 |
|------|------|
| `generated/catalog.md` | 71 组件完整目录表 |
| `generated/form.md` | 25 个表单组件 |
| `generated/data-display.md` | 12 个数据展示组件 |
| `generated/feedback.md` | 10 个反馈通知组件 |
| `generated/navigation.md` | 7 个导航组件 |
| `generated/layout.md` | 4 个布局容器组件 |
| `generated/editor.md` | 6 个编辑器组件 |
| `generated/general.md` | 7 个通用组件 |
| `generated/shared-types.md` | 共享类型定义 |
| `generated/manifest.json` | 同步元数据 |
| `references/dev-patterns.md` | 组件使用模式指南 |
