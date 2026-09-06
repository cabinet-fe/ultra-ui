---
title: "UKbd - 键盘按键"
description: "用 UKbd 在文中标记快捷键"
---

# UKbd - 键盘按键

## 引入

```ts
import { UKbd } from '@veltra/desktop'
```

## 示例

`UKbd` 没有 props，把按键文案放进默认插槽。组合键拆成多个 `UKbd`，中间用 `+` 连接。

```vue
<template>
  <p>保存：<u-kbd>Ctrl</u-kbd> + <u-kbd>S</u-kbd></p>
  <p>命令面板：<u-kbd>⌘</u-kbd> + <u-kbd>K</u-kbd></p>
</template>
```

## API / 类型

无独立 Props / Emits；通过默认插槽使用。

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
