# UCard — 卡片

> `import type { CardProps, CardEmits, CardExposed } from '@veltra/desktop'`

基础容器组件，支持宽度控制与融合样式。通过子组件 `UCardHeader`、`UCardCover`、`UCardContent`、`UCardAction` 组合出完整的卡片布局。

## Import

```ts
// UCard、UCardHeader、UCardCover、UCardContent、UCardAction 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `width` | `string \| number` | — | 卡片宽度，数字类型默认单位为 `px` |
| `integrate` | `boolean` | — | 融合样式，去掉卡片阴影，使其与背景融为一体 |

## Emits

无事件。

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 卡片内容，通常放置 `UCardHeader`、`UCardCover`、`UCardContent`、`UCardAction` |

## Exposed

```ts
interface CardExposed {}
```

无暴露成员。

---

## Sub-components

以下组件必须作为 `UCard` 的子节点使用，否则会在控制台输出警告。

### UCardHeader — 卡片头部

无 props，通过 default slot 放置标题或自定义内容。

### UCardCover — 卡片封面

| prop | type | default | 说明 |
|------|------|---------|------|
| `src` | `string` | — | **必填**。封面图片地址 |
| `height` | `string \| number` | — | 封面高度，数字类型默认单位为 `px`。未设时图片原始高度 |

### UCardContent — 卡片内容

| prop | type | default | 说明 |
|------|------|---------|------|
| `cover` | `boolean` | — | 封面模式，去除内边距与字号，适合放置无间距的封面图 |

### UCardAction — 卡片操作区

| prop | type | default | 说明 |
|------|------|---------|------|
| `alignRight` | `boolean` | — | 右对齐操作按钮 |

---

## Examples

### 基础卡片

```vue
<u-card width="320">
  <u-card-content>这是一张基础卡片</u-card-content>
</u-card>
```

### 带封面的卡片

```vue
<u-card width="360">
  <u-card-cover src="https://picsum.photos/360/200" height="200" />
  <u-card-header><h3>卡片标题</h3></u-card-header>
  <u-card-content>
    <p>卡片正文内容，描述这张卡片的相关信息。</p>
  </u-card-content>
  <u-card-action align-right>
    <u-button type="primary" text>操作一</u-button>
    <u-button type="primary" text>操作二</u-button>
  </u-card-action>
</u-card>
```

### 融合样式卡片

```vue
<u-card integrate>
  <u-card-header>无阴影卡片</u-card-header>
  <u-card-content>
    <p>当 integrate 为 true 时，卡片没有阴影，适合嵌入到其他容器中使用。</p>
  </u-card-content>
</u-card>
```

### 封面模式内容

```vue
<u-card width="400">
  <u-card-content cover>
    <img
      src="https://picsum.photos/400/180"
      alt="封面"
      style="width: 100%; border-radius: inherit"
    />
  </u-card-content>
  <u-card-header>自定义封面布局</u-card-header>
  <u-card-content>
    <p>使用 cover 模式可以让内容区无缝贴合图片。</p>
  </u-card-content>
</u-card>
```
