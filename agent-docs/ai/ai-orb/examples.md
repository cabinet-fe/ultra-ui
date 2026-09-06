---
title: UAiOrb 示例
description: 独立使用 UAiOrb，切换生命状态并用 react 播放瞬时表情
---

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
