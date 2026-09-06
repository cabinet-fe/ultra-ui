---
title: "UAiOrb - 活体球"
description: "独立使用 UAiOrb，切换生命状态并用 react 播放瞬时表情"
---

# UAiOrb - 活体球

## 引入

```ts
import { UAiOrb } from '@veltra/ai'
```

## 示例

`UAiOrb` 可脱离 `UAiChat` 单独放在任意页面。对话组件的欢迎区和工作球已经内置，通常不必再嵌一套。`size` 默认 `48`；`status` 为 `idle`、`thinking`、`speaking`。通过模板引用调用 `react` 播放约 1–2 秒表情，结束后回到当前 `status`。

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { UAiOrb, type AiOrbExposed, type AiOrbStatus } from '@veltra/ai'
import '@veltra/ai/style'

const status = ref<AiOrbStatus>('idle')
const orb = useTemplateRef<AiOrbExposed>('orb')
</script>

<template>
  <u-ai-orb ref="orb" :size="88" :status="status" @click="orb?.react('happy')" />
  <button type="button" @click="status = 'thinking'">thinking</button>
  <button type="button" @click="orb?.react('frustrated')">frustrated</button>
</template>
```

`react` 可取 `happy`、`shock`、`frustrated`。点击球体同时会 Q 弹并触发 `click`。

## API / 类型

```ts
/** 活体球生命状态：驱动常态动画（平静 / 思考 / 输出） */
export type AiOrbStatus = 'idle' | 'thinking' | 'speaking'

/**
 * 瞬时表情：播放约 1-2s 后自动回到 status 驱动的常态。
 * - happy：成功 / 回答完毕 —— 先睁大眼睛，再弯眼大笑 + 点头
 * - shock：惊讶 —— 睁大眼睛 + 小嘴微张 + 轻微后仰
 * - frustrated：受挫（如工具调用失败）—— 闭紧眼睛 + 摇头 + 嘴角下撇
 */
export type AiOrbReaction = 'happy' | 'shock' | 'frustrated'

export interface AiOrbProps {
  /** 球体直径（px），默认 48 */
  size?: number
  /** 生命状态，默认 idle */
  status?: AiOrbStatus
}

export interface AiOrbEmits {
  /** 点击球体（球体同时会做 Q 弹反馈） */
  (e: 'click'): void
}

export interface AiOrbExposed {
  /** 播放一次瞬时表情（对应阶段性事件，如回答完毕 / 工具调用失败） */
  react: (reaction: AiOrbReaction) => void
}
```

## 避坑与使用要点

- 独立 canvas 活体球，可脱离 `UAiChat` 使用。`UAiChat` 欢迎区与工作中状态已内置，一般不必再嵌一套。
