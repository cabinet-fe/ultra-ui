# UCard — 卡片

> `import type { CardProps, CardEmits, CardExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/card.ts`

基础容器组件，支持宽度控制与融合样式。通过子组件 `UCardHeader`、`UCardCover`、`UCardContent`、`UCardAction` 组合出完整的卡片布局。

## Import

```ts
// UCard、UCardHeader、UCardCover、UCardContent、UCardAction 由 Vite 自动导入，无需手动 import
```

## Sub-components

以下组件必须作为 `UCard` 的子节点使用，否则会在控制台输出警告。

### UCardHeader — 卡片头部

无 props，通过 default slot 放置标题或自定义内容。

### UCardCover — 卡片封面

| prop     | type               | default | 说明                                                  |
| -------- | ------------------ | ------- | ----------------------------------------------------- |
| `src`    | `string`           | —       | **必填**。封面图片地址                                |
| `height` | `string \| number` | —       | 封面高度，数字类型默认单位为 `px`。未设时图片原始高度 |

### UCardContent — 卡片内容

| prop    | type      | default | 说明                                               |
| ------- | --------- | ------- | -------------------------------------------------- |
| `cover` | `boolean` | —       | 封面模式，去除内边距与字号，适合放置无间距的封面图 |

### UCardAction — 卡片操作区

| prop         | type      | default | 说明           |
| ------------ | --------- | ------- | -------------- |
| `alignRight` | `boolean` | —       | 右对齐操作按钮 |

---

> 示例见 [examples.md](./examples.md)
