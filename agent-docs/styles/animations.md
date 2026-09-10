---
title: 动画与过渡 CSS 类参考
description: "'@veltra/styles/animations' 的 u-shine 文字扫光工具类与 '@veltra/styles/transitions' 的 10 个 Vue Transition 过渡预设（fade、fade-scale、slide、spring、zoom-in 系列）：类名清单、时长参数与按需引入方式。"
aliases: [u-shine, 扫光, 过渡动画, transition, Vue Transition, animations]
keywords: [u-shine, --u-shine-duration, fade, fade-scale, slide-down, slide-up, spring, zoom-in, zoom-in-top, prefers-reduced-motion, 文字扫光, 弹性缩放, 淡入淡出, 弹窗动画, 按需引入, keyframes]
---

# 动画与过渡 CSS 类参考

`@veltra/styles/animations` 与 `@veltra/styles/transitions` 两个子路径都**没有 JS 导出**：入口文件只副作用引入 CSS，可用产物是全局 CSS 类与 Vue 过渡名。animations 目前只有 `u-shine` 一个文字扫光类；transitions 提供 5 个文件、10 个过渡名，配合 `<Transition :name>` 使用。

## 快速上手

```ts
// src/main.ts —— 全量引入（两者均无 JS 导出，import 即生效）
import '@veltra/styles/animations'
import '@veltra/styles/transitions'
```

```vue
<!-- 组件里直接使用：扫光类 + Vue 过渡名 -->
<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(true)
</script>

<template>
  <span class="u-shine">加载中…</span>

  <Transition name="fade" mode="out-in">
    <p v-if="visible">内容</p>
  </Transition>
</template>
```

按体积要求可只引单个文件：`import '@veltra/styles/animations/shine.scss'`、`import '@veltra/styles/transitions/fade.css'`。包 `sideEffects` 已声明这些样式文件，tree-shaking 不会误删。

## API 签名

### 动画工具类（@veltra/styles/animations）

| 类名 | 效果 | 源文件 |
| --- | --- | --- |
| `u-shine` | 文字扫光：`linear-gradient(100deg, …)` 渐变以 `background-clip: text` 扫过文字，`linear infinite` 无限循环 | `animations/shine.scss` |

`u-shine` 依赖主题 token `--u-text-color-assist`（两端）与 `--u-text-color-title`（高光带）；keyframes 名为 `u-shine`，背景位置从 `200% 0` 扫到 `-200% 0`。声明 `prefers-reduced-motion: reduce` 时动画停止、背景清除、文字恢复 `currentColor`。

### Vue 过渡预设（@veltra/styles/transitions）

过渡名即 `<Transition name>` 的值，与源文件对应：

| 过渡名 | 效果 | 时长与曲线 | 源文件 |
| --- | --- | --- | --- |
| `fade` | 淡入淡出（仅 opacity） | 0.25s linear | `fade.scss` |
| `fade-scale` | 淡入 + 缩放：enter 从 `scale 0.8`、leave 到 `scale 0.9` | enter 0.3s `cubic-bezier(0.34, 1.56, 0.64, 1)` + opacity 0.35s ease；leave 0.2s ease-in | `fade-scale.scss` |
| `slide-down` | 自上而下滑入（enter-from `translateY(-10px)`） | 0.2s `cubic-bezier(0, 0, 0.2, 1)` | `slide.scss` |
| `slide-up` | 自下而上升入（enter-from `translateY(10px)`） | 0.2s `cubic-bezier(0, 0, 0.2, 1)` | `slide.scss` |
| `spring` | 弹性缩放：enter 跑 `spring-in` keyframes（0 → 1.1 → 1 → 1.02 → 1） | enter 0.5s ease-in-out；leave 0.4s `cubic-bezier(0.64, -0.32, 0.66, 1.06)` | `spring.scss` |
| `zoom-in` | 中心缩放（`scale 0.8`） | 0.15s，enter ease-in / leave ease-out | `zoom-in.scss` |
| `zoom-in-left` | 从左侧锚点横向缩放（`scaleX 0.8`，origin left center） | 0.15s，enter ease-in / leave ease-out | `zoom-in.scss` |
| `zoom-in-right` | 从右侧锚点横向缩放（origin right center） | 0.15s，enter ease-in / leave ease-out | `zoom-in.scss` |
| `zoom-in-top` | 从顶部锚点纵向缩放（`scaleY 0.8`，origin center top） | 0.15s，enter ease-in / leave ease-out | `zoom-in.scss` |
| `zoom-in-bottom` | 从底部锚点纵向缩放（origin center bottom） | 0.15s，enter ease-in / leave ease-out | `zoom-in.scss` |

`UDialog` 的默认过渡就是 `fade-scale`（组件自带引入该文件，业务里再对其他元素使用时需自行引入）。

## 参数说明

| 名称 | 类型 | 默认 | 必填 | 说明 |
| --- | --- | --- | :---: | --- |
| `--u-shine-duration` | CSS 自定义属性（时长值） | `2.4s` | 否 | `u-shine` 的单轮扫光时长；在元素或祖先上覆盖 |
| `<Transition name>` | `string` | — | 是 | 只接受上表列出的 10 个过渡名；其他名字无对应 CSS，不产生动画 |

`u-shine` 与 `spring` 等预设消费的主题 token（`--u-text-color-*`、`--u-transition-*`）来自 `loadTheme()` 注入，前置要求见 `styles/theme.md`。

## 典型示例

### u-shine 文字扫光并覆盖时长

```vue
<!-- src/components/ShineTitle.vue -->
<script setup lang="ts">
const text = '限时活动'
</script>

<template>
  <!-- 在元素上直接覆盖 CSS 变量，改扫光时长 -->
  <h3 class="u-shine" style="--u-shine-duration: 1.2s">{{ text }}</h3>
</template>

<style scoped>
h3 {
  display: inline-block;
  font-size: 24px;
}
</style>
```

系统开启「减少动态效果」时该元素自动退化为静态文字（`currentColor`），无需业务处理。

### fade-scale 弹窗式出现

```vue
<!-- src/components/ConfirmBox.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import '@veltra/styles/transitions/fade-scale.css'

const visible = ref(false)
</script>

<template>
  <button @click="visible = !visible">切换</button>

  <Transition name="fade-scale">
    <div v-if="visible" class="box">确认执行该操作？</div>
  </Transition>
</template>

<style scoped>
.box {
  padding: 16px;
  border-radius: var(--u-radius-default);
  box-shadow: var(--u-shadow-lg);
}
</style>
```

### slide-down 折叠展开

```vue
<!-- src/components/CollapseArea.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import '@veltra/styles/transitions/slide.css'

const open = ref(false)
</script>

<template>
  <Transition name="slide-down">
    <section v-if="open">被折叠的内容</section>
  </Transition>
</template>
```

`spring` 过渡面向可拖拽元素：enter / leave 全程使用独立变换属性 `scale` / `translate` 而非 `transform`，不与拖拽的内联 `transform` 互相覆盖；leave 结束时 `translate: 0 0 !important` 把元素归位到中心。

## 注意事项

> [!WARNING]
> - `@veltra/styles/animations` 与 `@veltra/styles/transitions` 没有 JS 导出（入口 `index.ts` 仅引入 CSS）；禁止 `import { … } from '@veltra/styles/animations'` 这样的具名导入。
> - 引入单个过渡 / 动画文件时，README 文档写法是 `.css`（`import '@veltra/styles/transitions/fade.css'`），AGENTS.md 文档写法是 `.scss`（`import '@veltra/styles/animations/shine.scss'`）；两种后缀均有对应产物。
> - `u-shine` 的颜色来自主题 token：未调用 `loadTheme` 时 `--u-text-color-*` 为空，扫光退化为不可见渐变。
> - 过渡名与 CSS 类强绑定（如 `spring-enter-active`），自造名字或改写这些类名都不会有动画；要调时长请在自己的样式里覆盖对应类的 `transition` / `animation`。
> - `fade-scale` 已被 `UDialog` 默认引入并对弹层使用；在同一页面给其他元素用 `fade-scale` 不冲突，但禁止重复全局引入同一文件后依赖加载顺序。
