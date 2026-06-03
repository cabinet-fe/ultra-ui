# UTable - 表格

## 类型文件

见 `./types.d.ts`

## 示例

见 `./examples.md`

## 辅助工具

本组件通常配合以下工具来使用。

### defineTableColumns

为列树批量合并 `align`、`minWidth` 等公共属性（DFS，不覆盖列上已有值）。

使用示例:

```ts
import { defineTableColumns } from '@veltra/desktop'
```
