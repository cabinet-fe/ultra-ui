---
title: UKbd 键盘按键示例
description: 用 UKbd 在文中标记快捷键
---

`UKbd` 没有 props，把按键文案放进默认插槽。组合键拆成多个 `UKbd`，中间用 `+` 连接。

```vue
<template>
  <p>保存：<u-kbd>Ctrl</u-kbd> + <u-kbd>S</u-kbd></p>
  <p>命令面板：<u-kbd>⌘</u-kbd> + <u-kbd>K</u-kbd></p>
</template>
```
