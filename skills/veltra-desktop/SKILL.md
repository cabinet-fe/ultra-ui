---
name: veltra-desktop
description: >
  @veltra/desktop 组件库（71 个组件）的 Props/Emits/Exposed 类型文档。
  当开发页面涉及 UI 组件、表单、表格、对话框、选择器、树、消息通知、编辑器、导航菜单等时使用。
  先查 catalog，再打开 generated/components/ 下单文件；分类索引见 generated/categories/。
---

# veltra-desktop

## 分类概览

| 分类 | 数量 | 索引 | 组件举例 |
|------|------|------|----------|
| 表单 | 25 | [categories/form.md](generated/categories/form.md) | form, input, select, date-picker |
| 数据展示 | 12 | [categories/data-display.md](generated/categories/data-display.md) | table, tree, list, paginator |
| 反馈通知 | 10 | [categories/feedback.md](generated/categories/feedback.md) | message, dialog, drawer, loading |
| 导航 | 7 | [categories/navigation.md](generated/categories/navigation.md) | menu, tabs, breadcrumb |
| 布局容器 | 4 | [categories/layout.md](generated/categories/layout.md) | layout, card, scroll |
| 编辑器 | 6 | [categories/editor.md](generated/categories/editor.md) | code-editor, table-editor |
| 通用 | 7 | [categories/general.md](generated/categories/general.md) | button, icon, action |

- 全量目录表：[catalog.md](generated/catalog.md)
- 每组件类型片段：`generated/components/<name>.md`
- 共享类型：[shared-types.md](generated/shared-types.md)

根目录执行 `bun run sync-veltra-desktop` 或 `bun run sync-skills` 可重新生成 `generated/`。

## 导入约定

### 自动按需导入（推荐）

`unplugin-components` + `U` 前缀解析；模板中 `<u-button>` 与 `<UButton>` 等价，resolver 会引入对应 `style.ts`。

### 手动导入

```typescript
import type { ButtonProps, TableColumn, FormExposed } from '@veltra/desktop'
import { FormModel, DynamicFormModel, defineTableColumns, message } from '@veltra/desktop'
import { Edit, Delete, Search } from '@veltra/icons/normal'
```

## 核心模式（摘要）

- **v-model**：表单组件统一 `modelValue` / `update:modelValue`。
- **FormModel + `<u-form field>`**：`model.validate()`、`resetData()`、`setData()`、`clearValidate()`。
- **表格列**：`defineTableColumns`，列插槽 `#column:<key>`；树用 `#default` 等作用域插槽。
- **Exposed**：`shallowRef<TreeExposed>()` 等访问实例方法。

更完整的用法与边界见 [references/dev-patterns.md](references/dev-patterns.md)。

## 参考索引

| 路径 | 内容 |
|------|------|
| `generated/catalog.md` | 组件目录表（含链到各 `components/*.md`） |
| `generated/categories/*.md` | 分类 → 组件文档链接 |
| `generated/components/*.md` | 单组件类型定义 |
| `generated/shared-types.md` | 共享 types |
| `generated/manifest.json` | 同步元数据 |
| `references/dev-patterns.md` | 使用模式与排错 |
