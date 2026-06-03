# UBatchEdit — 批量编辑

> `import type { BatchEditProps, BatchEditEmits, BatchEditFeature, BatchEditExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/batch-edit.ts`

基于 UTable 的左右分栏批量编辑：左侧表格（行内新增/复制/删除/添加子级），右侧动态表单。继承 `TableProps` 全部属性。

## Import

```ts
// UBatchEdit 由 Vite 自动导入，无需手动 import
import { FormModel, defineTableColumns } from '@veltra/desktop'
```

## Props（专属）

继承 `TableProps`（详见 [table/api.md](../table/api.md)），追加：

| prop           | type                                                                                                                     | default            | 说明                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------ |
| `model`        | `FormModel \| DynamicFormModel`                                                                                          | —                  | 表单模型（优先级 > 列的 `rules`）                      |
| `title`        | `string`                                                                                                                 | —                  | 表格标题                                               |
| `cols`         | `string \| [string, string]`                                                                                             | `['1fr', '420px']` | 左右分栏列宽                                           |
| `readonly`     | `boolean`                                                                                                                | —                  | 只读：禁用编辑                                         |
| `labelWidth`   | `string \| number`                                                                                                       | —                  | 表单 label 宽度                                        |
| `deleteMethod` | `(data: Record<string, any>[]) => Promise<any> \| any`                                                                   | —                  | 删除回调（异步校验/远程删除）                          |
| `saveMethod`   | `(data: Record<string, any>, actionType: 'create' \| 'update', parentData?: Record<string, any>) => Promise<any> \| any` | —                  | 保存回调，返回值替代表单数据写入 `data`                |
| `features`     | `BatchEditFeature[] \| { [key in BatchEditFeature]?: boolean \| ((row: TableRow) => boolean) }`                          | —                  | 功能控制：数组=白名单；对象 `false`/函数=按行动态关闭  |
| `actionsProps` | `Partial<Record<BatchEditFeature, ActionProps>>`                                                                         | —                  | 操作按钮属性（如 `{ delete: { needConfirm: true } }`） |

`BatchEditFeature` = `'create' | 'update' | 'copy' | 'delete' | 'view' | 'createChild'`

## Emits（专属）

继承 `TableEmits`，追加：

| event         | 参数                             | 说明                             |
| ------------- | -------------------------------- | -------------------------------- |
| `update:data` | `(value: Record<string, any>[])` | 数据变更（新增/删除/复制后触发） |

## 键盘快捷键

| 快捷键               | 说明                       |
| -------------------- | -------------------------- |
| `Esc`                | 关闭右侧表单               |
| `⌘/Ctrl + S`         | 保存当前编辑               |
| `⌘/Ctrl + Backspace` | 删除当前编辑行（更新模式） |
| `⌘/Ctrl + N`         | 新增（表单未打开时）       |

> 示例见 [examples.md](./examples.md)
