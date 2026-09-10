---
title: UKbd 键盘按键
description: "@veltra/desktop 导出的键盘按键标签组件。渲染 <kbd> 元素并在文档流中呈现立体键帽样式（0.75em、自动随上下文字号缩放），用于在段落、表格、快捷键说明中标记单个按键或组合键。"
aliases: [UKbd, Kbd, kbd, 键盘按键, 快捷键标签, KeyboardKey]
keywords: [UKbd, kbd, 键帽, 快捷键, 组合键, 快捷键说明, 按键标签, Ctrl, Esc, 修饰键]
---

# UKbd 键盘按键

`@veltra/desktop` 导出组件 `UKbd`，渲染 `<kbd class="u-kbd">`，用多层 box-shadow 模拟立体键帽外观。无 props、无事件、无暴露方法，按键文案放在默认插槽。用于文档、空状态、设置页里标注快捷键。

## 快速上手

```vue
<script setup lang="ts">
import { UKbd } from '@veltra/desktop'
</script>

<template>
  <p>按下 <u-kbd>Ctrl + S</u-kbd> 保存</p>
</template>
```

`UKbd` 字号是 `0.75em`，随父级字号缩放；放在 `font-size: 20px` 的段落里键帽即为 15px。视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、键帽无颜色。

## API 签名

无独立 Props / Emits / Exposed。组件只接收默认插槽，键帽内容为插槽渲染结果（文本、`+`、符号均可）：

```vue
<template>
  <u-kbd>Esc</u-kbd>
</template>
```

## 参数说明

无 props。外观随环境自动适配，无尺寸 / 颜色档位：

| 外观项 | 值 | 来源 |
| --- | --- | --- |
| 字号 | `0.75em`（相对父级） | 组件样式，写死 |
| 最小宽度 | `1.75em` | 组件样式，写死 |
| 高度 | `fit-content`，行高 `1.7em` | 组件样式，写死 |
| 键帽底色 / 文字色 | `--u-bg-color-top` / `--u-text-color-main` | 主题 token，随主题变化 |
| 立体效果 | 三层 box-shadow（`--u-component-kbd-*` token） | 主题 token，随主题变化 |
| 换行 | `white-space: nowrap`，不换行 | 组件样式，写死 |

## 典型示例

### 单键与组合键标注

```vue
<script setup lang="ts">
import { UKbd } from '@veltra/desktop'
</script>

<template>
  <p>按下 <u-kbd>Esc</u-kbd> 关闭对话框</p>
  <p><u-kbd>Ctrl</u-kbd> + <u-kbd>Shift</u-kbd> + <u-kbd>I</u-kbd> 打开开发者工具</p>
  <p><u-kbd>⌘</u-kbd> + <u-kbd>K</u-kbd> 打开命令面板</p>
</template>
```

### 在设置项与表格里标注快捷键

```vue
<script setup lang="ts">
import { UKbd } from '@veltra/desktop'

const shortcuts = [
  { action: '保存', keys: 'Ctrl + S' },
  { action: '撤销', keys: 'Ctrl + Z' },
  { action: '全局搜索', keys: 'Ctrl + K' }
]
</script>

<template>
  <table>
    <tr v-for="item in shortcuts" :key="item.action">
      <td>{{ item.action }}</td>
      <td><u-kbd>{{ item.keys }}</u-kbd></td>
    </tr>
  </table>
</template>
```

## 注意事项

> [!WARNING]
> - `UKbd` 是纯展示标签，不监听键盘事件；要捕获按键行为用原生 `addEventListener('keydown', ...)` 或 Vue 的 `@keydown`，禁止把交互逻辑寄望于本组件。
> - 组合键的 `+` 由业务写在插槽里（如 `<u-kbd>Ctrl + S</u-kbd>` 整串放一个键帽），或拆成多个 `UKbd` 用文本 `+` 连接；组件不会自动拆分组合键。
> - 无 props：没有 `size` / `type` / `variant`；传的 `class` / `style` 会透传到 `<kbd>` 元素上，配合覆盖 `.u-kbd` 的 CSS 变量改外观。
> - 内容不换行（`white-space: nowrap`）；超长文案会撑开布局，键帽里只放按键名。
> - 元素是行内 `inline-flex` 且 `vertical-align: text-top`，可直接嵌入句子里，不需要额外对齐样式。

## 常见问题

### 键帽没有立体感 / 全是透明

原因：入口未初始化主题，`--u-component-kbd-*` 与 `--u-bg-color-top` token 为空。修复：

```ts
// src/main.ts
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
```

### 键帽和周围文字大小不一致

原因：`UKbd` 字号固定为父级的 `0.75em`。这是设计行为；需要更大键帽时给父元素调字号，禁止给 `<u-kbd>` 传 `size` 属性（组件不声明该 prop，传了只落到 `<kbd>` 的 attrs 上）。
