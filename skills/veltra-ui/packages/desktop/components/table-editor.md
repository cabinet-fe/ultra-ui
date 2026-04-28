# UTableEditor — 表格编辑器

> `import type { TableEditorProps, TableEditorEmits } from '@veltra/desktop'`

## Import

```ts
import { UTableEditor } from '@veltra/desktop'
```

基于 `UTable` 的行内编辑版本，支持在表格中直接编辑单元格数据。Props/Emits 继承自 `TableProps`/`TableEmits`。

## Examples

```vue
<u-table-editor v-model:data-source="list" :columns="columns" />
```
