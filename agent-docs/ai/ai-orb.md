---
title: UAiOrb 活体球
description: "@veltra/ai 的 canvas 活体球组件：idle/thinking/speaking 三种生命状态驱动常态动画，react 播放 happy/shock/frustrated 瞬时表情，支持指针视线跟随与点击 Q 弹反馈，可脱离 UAiChat 独立使用。"
aliases: [AiOrb, ai-orb, 活体球, Orb, 生命球]
keywords: [react, happy, shock, frustrated, thinking, speaking, idle, AiOrbStatus, AiOrbReaction, 瞬时表情, 生命状态, canvas 动画, 视线跟随, 点击反馈, 眨眼, 虚拟形象]
---

# UAiOrb 活体球

`@veltra/ai` 导出 canvas 组件 `UAiOrb`：一个有呼吸、眨眼、视线游移等常态动画的虚拟形象球，用 `status` 驱动三种生命状态，用暴露方法 `react()` 播放约 1-2s 的瞬时表情。可脱离 `UAiChat` 在任意页面独立使用。

## 快速上手

引入 `import '@veltra/ai/style'` 后直接使用；通过模板引用调用 `react` 播放瞬时表情。

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { UAiOrb, type AiOrbExposed, type AiOrbStatus } from '@veltra/ai'
import '@veltra/ai/style'

const status = ref<AiOrbStatus>('idle')
const orbRef = useTemplateRef<AiOrbExposed>('orb')
</script>

<template>
  <u-ai-orb ref="orb" :size="48" :status="status" @click="orbRef?.react('happy')" />
  <button type="button" @click="status = 'thinking'">thinking</button>
</template>
```

## API 签名

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
  /** 生命状态，默认 'idle' */
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

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `size` | `number` | `48` | 否 | 直径 px；改变时画布随之 resize |
| `status` | `'idle' \| 'thinking' \| 'speaking'` | `'idle'` | 否 | `idle` 平静（随机眨眼，偶发双眨 + 视线游移转头）；`thinking` 思考（眯眼 + 视线缓慢扫视 + 右上角「?」轻晃）；`speaking` 输出（嘴随节奏开合 + 微动） |

## 方法与事件

| 成员 | 形态 | 说明 |
| --- | --- | --- |
| `click` 事件 | emit，无 payload | 点击球体触发；`pointerdown` 即触发挤压动画（Q 弹反馈），`click` 随后发出 |
| `react(reaction)` | 暴露方法，同步，返回 `void`，不抛错 | `reaction` 取 `'happy' \| 'shock' \| 'frustrated'`；播放约 1-2s 后自动回到 `status` 常态 |

### 内置行为

- 指针在球上移动时视线跟随指针（`pointermove`），移出后恢复状态默认视线。
- 滚出视口的球暂停动画循环（IntersectionObserver），回到视口恢复；同屏多个球不累积开销。
- 系统开启「减少动态」偏好（`prefers-reduced-motion: reduce`）时只画一帧静态画面，不启动动画循环。
- 根元素是 `canvas` 且带 `aria-hidden="true"`：纯装饰组件，不承载无障碍语义。

## 典型示例

### 三种表情与状态切换

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { UAiOrb, type AiOrbExposed, type AiOrbReaction, type AiOrbStatus } from '@veltra/ai'
import '@veltra/ai/style'

const status = ref<AiOrbStatus>('idle')
const orbRef = useTemplateRef<AiOrbExposed>('orb')

const react = (reaction: AiOrbReaction) => orbRef.value?.react(reaction)
</script>

<template>
  <u-ai-orb :size="140" :status="status" />
  <div>
    <button type="button" @click="status = 'idle'">idle</button>
    <button type="button" @click="status = 'thinking'">thinking</button>
    <button type="button" @click="status = 'speaking'">speaking</button>
    <button type="button" @click="react('happy')">开心</button>
    <button type="button" @click="react('shock')">惊讶</button>
    <button type="button" @click="react('frustrated')">沮丧</button>
  </div>
</template>
```

### 对接异步任务状态

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { UAiOrb, type AiOrbExposed } from '@veltra/ai'
import '@veltra/ai/style'

const orbRef = useTemplateRef<AiOrbExposed>('orb')
const status = ref<'idle' | 'thinking' | 'speaking'>('idle')

const run = async () => {
  status.value = 'thinking' // 请求中：眯眼 + 「?」
  try {
    const res = await fetch('https://<你的接口地址>/api/answer', { method: 'POST' })
    const data = (await res.json()) as { text: string }
    console.log(data.text)
    status.value = 'speaking' // 输出中：嘴随节奏开合
    await new Promise((resolve) => setTimeout(resolve, 2000))
    status.value = 'idle'
    orbRef.value?.react('happy') // 回答完毕
  } catch {
    status.value = 'idle'
    orbRef.value?.react('frustrated') // 受挫
  }
}
</script>

<template>
  <u-ai-orb ref="orb" :size="64" :status="status" @click="run" />
</template>
```

### 独立悬浮入口（脱离 UAiChat）

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { UAiOrb, type AiOrbExposed } from '@veltra/ai'
import '@veltra/ai/style'

const orbRef = useTemplateRef<AiOrbExposed>('orb')
const clicks = ref(0)
</script>

<template>
  <!-- 固定在右下角的助手入口：点击计数并播放惊讶表情 -->
  <div style="position: fixed; right: 24px; bottom: 24px; cursor: pointer">
    <u-ai-orb ref="orb" :size="56" status="idle" @click="clicks++; orbRef?.react('shock')" />
    <p>已点击 {{ clicks }} 次</p>
  </div>
</template>
```

## 注意事项

> [!WARNING]
> - 本组件是独立的 canvas 活体球，可脱离 `UAiChat` 使用；但 `UAiChat` 的欢迎区与生成中「工作中」状态已内置活体球，禁止再往 `UAiChat` 里嵌一套。
> - 系统开启「减少动态」偏好时只渲染一帧静态画面，动画不循环；这是无障碍行为，不是 bug。
> - 根元素 `aria-hidden="true"`，禁止把必须被读屏感知的信息只放在球体上。
> - `react` 是瞬时表情，播放约 1-2s 后回到 `status` 常态；需要持续状态时改 `status`，不要反复调 `react`。
> - 视觉依赖主题初始化：入口 `import '@veltra/styles/normalize'` 并调用 `loadTheme()`，否则 `--u-*` token 为空、球体无颜色；本组件颜色取自主题 `--u-*` 变量。

## 常见问题

### 球不动，只有一帧静态画面

原因：命中 `prefers-reduced-motion: reduce`（系统减少动态偏好），或球滚出了视口（IntersectionObserver 暂停了动画循环）。修复：关闭系统减少动态偏好，或让球保持在视口内。
