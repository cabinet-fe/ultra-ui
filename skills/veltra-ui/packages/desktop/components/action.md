# UAction / UActionGroup — 操作按钮

> `import type { ActionProps } from '@veltra/desktop'`

操作按钮继承 `ButtonProps`，增加 `needConfirm` 确认功能。`UActionGroup` 可折叠多余按钮到下拉菜单。

## Import

```ts
import { UAction, UActionGroup } from '@veltra/desktop'
```

## UAction Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `needConfirm` | `boolean` | — | 点击时需要二次确认 |
| (继承 UButton) | — | — | `type`, `size`, `text`, `disabled` ... |

## Emits

| event | 说明 |
|-------|------|
| `run` | 点击执行（含确认后） |

## UActionGroup Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `max` | `number` | — | 最大显示数量，超出折叠到下拉菜单 |
| `loading` | `boolean` | — | 加载中 |
| `circle` | `boolean` | — | 圆形按钮 |

## Examples

### 基础操作组

```vue
<u-action-group :max="4">
  <u-action>查看</u-action>
  <u-action>编辑</u-action>
  <u-action need-confirm type="danger">删除</u-action>
</u-action-group>
```

### 表格操作列（推荐模式）

```vue
<u-table :columns="columns" :data="data" row-key="id">
  <template #column:action>
    <u-action-group :max="4">
      <u-action @run="handleEdit">编辑</u-action>
      <u-action need-confirm type="danger" @run="handleDelete">删除</u-action>
    </u-action-group>
  </template>
</u-table>

<script setup>
const columns = defineTableColumns([
  { key: 'name', name: '名称' },
  { key: 'action', name: '操作', width: 150, align: 'center' }
])
</script>
```
