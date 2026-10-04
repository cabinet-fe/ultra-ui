---
title: 'USkeleton 骨架屏（@veltra/mobile 移动端）'
description: '@veltra/mobile 导出的骨架屏组件：内容加载前渲染占位块，标题 / 段落 / 头像 / 按钮形态可组合，loading 为 false 时切换渲染插槽内的实际内容，支持胶囊圆角与呼吸动画；占位尺寸按移动端触控密度放大（头像 44px）。'
aliases: [USkeleton, Skeleton, 骨架屏, 骨架, 占位, 加载占位, 移动端骨架]
keywords:
  [
    SkeletonProps,
    loading,
    animated,
    avatar,
    title,
    paragraph,
    rows,
    button,
    round,
    骨架屏,
    加载占位,
    占位块,
    加载态,
    呼吸动画,
    内容切换,
    首屏占位
  ]
---

# USkeleton 骨架屏（@veltra/mobile 移动端）

`@veltra/mobile` 导出组件 `USkeleton`：内容加载完成前渲染灰色占位块（标题、段落、头像、按钮形态可任意组合），`loading` 为 `false` 时切换渲染默认插槽里的实际内容。支持胶囊圆角与呼吸明暗动画。没有事件、插槽属性与暴露方法。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USkeleton } from '@veltra/mobile'
import '@veltra/mobile/components/skeleton/style'

const loading = ref(true)
</script>

<template>
  <!-- 默认：标题占位 + 3 行段落占位 -->
  <USkeleton :loading="loading">
    <div>
      <h3>实际标题</h3>
      <p>实际内容，接口返回后替换占位块。</p>
    </div>
  </USkeleton>
</template>
```

前置条件：入口已 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则占位块填充色 token（`--u-bg-color-hover`）为空。组件样式按需引入：`import '@veltra/mobile/components/skeleton/style'`。

## API 签名

```ts
/** 骨架屏组件属性 */
export interface SkeletonProps {
  /** 是否处于加载态；false 时渲染默认插槽的实际内容，默认 true */
  loading?: boolean

  /** 是否显示头像占位块，默认 false */
  avatar?: boolean

  /** 是否显示标题占位块，默认 true */
  title?: boolean

  /** 是否显示段落占位块，默认 true */
  paragraph?: boolean

  /** 段落占位块行数，默认 3 */
  rows?: number

  /** 是否显示按钮形态占位块，默认 false */
  button?: boolean

  /** 是否使用胶囊圆角，作用于标题 / 段落 / 按钮占位块，默认 false */
  round?: boolean

  /** 是否开启呼吸动画，默认 false */
  animated?: boolean
}

/** 骨架屏组件定义的事件（空） */
export interface SkeletonEmits {}
```

`SkeletonEmits` 为空，组件无事件。默认插槽放实际内容，仅 `loading === false` 时渲染。

## 参数说明

| 参数        | 类型      | 默认     | 必填 | 约束                                                          |
| ----------- | --------- | -------- | :--: | ------------------------------------------------------------- |
| `loading`   | `boolean` | `true`   |  否  | `true` 渲染 `.um-skeleton` 根元素；`false` 直接渲染插槽内容     |
| `avatar`    | `boolean` | `false`  |  否  | 44px 圆形占位，位于内容左侧，始终为圆形（不受 `round` 影响）   |
| `title`     | `boolean` | `true`   |  否  | 高 18px、宽 33% 的占位条                                      |
| `paragraph` | `boolean` | `true`   |  否  | 高 15px 的占位条；最后一行固定宽 60% 模拟自然段落             |
| `rows`      | `number`  | `3`      |  否  | 段落行数，取值 ≥ 1；`paragraph` 为 `false` 时无效             |
| `button`    | `boolean` | `false`  |  否  | 宽 88px、高 `--u-form-component-height-default` 的按钮形态占位 |
| `round`     | `boolean` | `false`  |  否  | 标题 / 段落 / 按钮占位条圆角改为 `--u-radius-large` 胶囊形    |
| `animated`  | `boolean` | `false`  |  否  | 占位块 1.4s 周期呼吸明暗（opacity 1 → 0.4 → 1）               |

## 典型示例

### 头像 + 段落组合与按钮形态

```vue
<script setup lang="ts">
import { USkeleton } from '@veltra/mobile'
import '@veltra/mobile/components/skeleton/style'
</script>

<template>
  <!-- 卡片式占位：44px 圆形头像 + 2 行段落 -->
  <USkeleton avatar :rows="2" animated />

  <!-- 纯按钮占位：关闭标题与段落后只剩按钮块 -->
  <USkeleton :title="false" :paragraph="false" button round />
</template>
```

### 加载完成切换实际内容

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { USkeleton } from '@veltra/mobile'
import '@veltra/mobile/components/skeleton/style'

const loading = ref(true)
const article = ref<{ title: string; body: string } | null>(null)

onMounted(async () => {
  const res = await fetch('/api/article/1')
  article.value = await res.json()
  loading.value = false // 占位块被插槽内容整体替换
})
</script>

<template>
  <USkeleton :loading="loading" avatar :rows="2" animated>
    <article v-if="article">
      <h3>{{ article.title }}</h3>
      <p>{{ article.body }}</p>
    </article>
  </USkeleton>
</template>
```

### 首屏列表占位

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { USkeleton } from '@veltra/mobile'
import '@veltra/mobile/components/skeleton/style'

const loading = shallowRef(true)
</script>

<template>
  <!-- 移动端列表首屏：多行段落占位 + 底部按钮形态占位 -->
  <USkeleton :loading="loading" :rows="4" button animated>
    <p>接口返回后渲染实际列表。</p>
  </USkeleton>
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库形态开关是扁平布尔 props（`avatar` / `title` / `paragraph` / `button` / `rows`），不是 AntD 的对象写法（`paragraph={{ rows: 4 }}`）；也没有独立的 `SkeletonButton` / `SkeletonAvatar` / `SkeletonImage` 子组件，按钮形态用 `button` prop。
> - 动画开关叫 `animated`，不是 AntD 的 `active`。
> - 移动端占位尺寸按触控密度放大：头像 44px（桌面端 40px）、标题高 18px（桌面端 16px）、段落高 15px（桌面端 14px）、按钮宽 88px（桌面端 80px）；布局与桌面端一致，按移动端视觉密度对齐。
> - `loading === false` 时插槽内容直接作为组件根渲染，无包裹元素；禁止给 `USkeleton` 传 `class` / `style` 等透传属性，多根形态下无法自动继承。需要限宽时套一层容器。
> - 占位块填充色取 `--u-bg-color-hover`，标题 / 段落宽度是百分比；占位块行高与实际内容行高不一致时切换瞬间会有轻微跳动，需精确保位时按实际内容行数传 `rows`。
> - 移动端按需样式路径是 `@veltra/mobile/components/skeleton/style`，不是 `@veltra/desktop/components/skeleton/style`。
> - 整块区域的加载遮罩用 `vLoading` 指令（`mobile/loading.md`），`USkeleton` 只做内容占位。

## 常见问题

### loading 已设为 false 但占位块还在

原因：`loading` 绑定丢失响应性，常见写法是把值解构后再传。修复：直接绑定 ref：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USkeleton } from '@veltra/mobile'
import '@veltra/mobile/components/skeleton/style'

const loading = ref(true)

async function load() {
  await new Promise((r) => setTimeout(r, 1000))
  loading.value = false
}

load()
</script>

<template>
  <USkeleton :loading="loading">
    <p>实际内容</p>
  </USkeleton>
</template>
```

### 想要跨端一致的占位尺寸

原因：两端常量不同（见上文注意事项），同名组件在移动端占位块略大。修复：以各端文档值为准布局；要求像素级一致时在业务样式里覆盖 `.um-skeleton__avatar` 等尺寸。
