# UText — 文本

> `import type { TextProps, TextEmits, TextExposed } from '@veltra/desktop'`

文本展示组件，支持预设文本级联、字体样式控制与关键词高亮。仅渲染 slot 内的文本节点（忽略非文本 VNode），底层输出 `<p>` 标签。

## Import

```ts
// UText 由 Vite 自动导入，无需手动 import
```

## Props

| prop        | 类型                   | 默认值      | 说明                                                                 |
|-------------|------------------------|-------------|----------------------------------------------------------------------|
| `as`        | `'main-title' \| 'title' \| 'sub-title' \| 'content' \| 'additional'` | `'content'` | 预设文本类型，决定字号、粗细与颜色                                    |
| `fontSize`  | `string \| number`     | —           | 自定义字号，与 `as` 同时指定时会覆盖预设字号                          |
| `deleted`   | `boolean`              | —           | 删除线（`text-decoration: line-through`）                             |
| `underline` | `boolean`              | —           | 下划线（`text-decoration: underline`）。与 `deleted` 同时指定时后者覆盖 |
| `bold`      | `boolean`              | —           | 粗体，与 `as` 同时指定时覆盖预设字体粗细                              |
| `italic`    | `boolean`              | —           | 斜体                                                                 |
| `highlight` | `string \| string[]`   | —           | 高亮关键词，对 slot 文本内容进行匹配，命中的片段包裹 `<mark>` 标签   |

### 预设 as 对照

| 值           | 字号   | 粗细 | 颜色   | 用途     |
|--------------|--------|------|--------|----------|
| `main-title` | 18px   | 600  | #333   | 主标题   |
| `title`      | 16px   | 600  | #333   | 标题     |
| `sub-title`  | 16px   | 500  | #999   | 副标题   |
| `content`    | 14px   | 300  | #666   | 正文内容 |
| `additional` | 12px   | 300  | #999   | 附加说明 |

## Emits

| event              | 参数                         | 说明 |
|--------------------|------------------------------|------|
| `update:modelValue` | `(value: string)`    | 文本变化时触发 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 文本内容。仅文本节点会被渲染，非文本 VNode 被过滤 |

## Exposed

```ts
interface TextExposed {}
```

## Examples

### 预设层级

```vue
<u-text as="main-title">这是主标题</u-text>
<u-text as="title">这是标题</u-text>
<u-text as="sub-title">这是副标题</u-text>
<u-text as="content">这是正文内容，as 默认即为 content</u-text>
<u-text as="additional">这是附加说明文字</u-text>
```

### 自定义字号与字体样式

```vue
<u-text font-size="20px">自定义 20px 文本</u-text>
<u-text :font-size="24">数字类型自动补 px</u-text>
<u-text bold>粗体文本</u-text>
<u-text bold italic>粗斜体文本</u-text>
<u-text deleted>已删除文本</u-text>
<u-text underline>带下划线的文本</u-text>
```

### 关键词高亮

```vue
<!-- 单个关键词高亮 -->
<u-text highlight="Vue">这是一段关于 Vue 框架的介绍文字</u-text>

<!-- 多个关键词高亮 -->
<u-text :highlight="['Vue', 'TypeScript']">
  Vue 3 配合 TypeScript 开发体验极佳
</u-text>

<!-- 结合预设 -->
<u-text as="content" :highlight="['重要', '关键']">
  这段文字中有重要和关键两个高亮词
</u-text>
```

### 组合用法

```vue
<u-text
  as="main-title"
  bold
  underline
  :highlight="['发布']"
  :font-size="22"
>
  新版本发布公告
</u-text>

<u-text
  as="additional"
  deleted
  italic
>
  该功能已在下个版本中移除
</u-text>
```
