---
title: "UNotification - 通知"
description: "UNotification 组件 API"
---

# UNotification - 通知

## 类型文件

见 `packages/desktop/src/types/notification.ts`

## 示例

见 `./examples.md`

## 辅助工具

本组件通常配合以下工具来使用。

### notification

函数式通知条；另有 `primary` / `success` / `info` / `warning` / `danger` 快捷方法与按方位 `closeAll(position?)`。

使用示例:

```ts
import { notification } from '@veltra/desktop'
```
