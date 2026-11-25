---
"@veltra/desktop": patch
---

移除穿梭框组件 `UTransfer`（`<u-transfer>`）、其样式入口 `@veltra/desktop/components/transfer/style` 及类型导出 `TransferOption`、`TransferDirection`、`TransferProps`、`TransferEmits`、`TransferExposed`。平铺数据多选改用 `UMultiSelect`：`dataSource` 作为 `options` 传入，选项字段 `key` 通过 `value-key="key"` 映射，`v-model` 仍为已选项集合；树形数据改用 `UTreeSelect`。

```vue
<!-- 旧 -->
<u-transfer v-model="targetKeys" :data-source="options" />

<!-- 新 -->
<u-multi-select v-model="targetKeys" value-key="key" :options="options" />
```
