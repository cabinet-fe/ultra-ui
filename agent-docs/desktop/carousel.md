---
title: UCarousel 走马灯
description: 从 @veltra/desktop 导入 UCarousel 走马灯组件，多页横向轮播：v-model:active-index 索引双向绑定、自动播放与间隔、循环回绕、前后箭头与指示器圆点切换，配合 UCarouselItem 渲染单页。
aliases: [UCarousel, UCarouselItem, Carousel, CarouselItem, 走马灯, 轮播图, 旋转木马]
keywords:
  [
    activeIndex,
    autoplay,
    interval,
    loop,
    arrows,
    dots,
    走马灯,
    轮播,
    轮播图,
    自动播放,
    循环播放,
    指示器,
    切换箭头,
    banner,
    首页轮播
  ]
---

# UCarousel 走马灯

`@veltra/desktop` 导出组件 `UCarousel`（轮播容器）与 `UCarouselItem`（单页）：在一张横向轨道上轮播多页内容，默认插槽里的每个 `UCarouselItem` 是一页。切换方式有四种：`v-model:active-index` 受控、`autoplay` 自动播放、`arrows` 前后箭头、`dots` 指示器圆点。切换动画是轨道整体 `translateX` 滑动，时长与缓动取主题 token。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UCarousel, UCarouselItem } from '@veltra/desktop'
</script>

<template>
  <!-- 默认：指示器显示、无箭头、不自动播放、循环 -->
  <u-carousel v-model:active-index="active" arrows>
    <u-carousel-item>
      <div style="height: 200px">第 1 页</div>
    </u-carousel-item>
    <u-carousel-item>
      <div style="height: 200px">第 2 页</div>
    </u-carousel-item>
  </u-carousel>
</template>
```

前置条件：入口已 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则箭头、圆点与底色 token 为空。走 resolver 的模板组件自动带样式；显式 import 时必须补 `import '@veltra/desktop/components/carousel/style'`。

## API 签名

```ts
/** 走马灯组件属性 */
export interface CarouselProps {
  /** 当前页索引，从 0 开始，v-model:active-index 双向绑定，默认 0 */
  activeIndex?: number

  /** 是否自动播放，默认 false */
  autoplay?: boolean

  /** 自动播放间隔（毫秒），默认 3000 */
  interval?: number

  /** 是否循环：末页向后回到首页、首页向前回到末页，默认 true */
  loop?: boolean

  /** 是否显示前后切换箭头，默认 false */
  arrows?: boolean

  /** 是否显示指示器圆点，默认 true */
  dots?: boolean
}

/** 走马灯组件定义的事件 */
export interface CarouselEmits {
  (e: 'update:activeIndex', index: number): void
  (e: 'change', current: number, prev: number): void
}

/** 走马灯单页组件属性：页内容经默认插槽渲染，暂无配置项 */
export interface CarouselItemProps {}
```

`UCarousel` 默认插槽渲染各页，必须每页一个 `UCarouselItem`；`UCarouselItem` 默认插槽渲染页内容。

## 参数说明

| 参数           | 类型      | 默认      | 必填 | 约束                                                                  |
| -------------- | --------- | --------- | :--: | --------------------------------------------------------------------- |
| `activeIndex`  | `number`  | `0`       |  否  | `v-model:active-index` 双向绑定；有效范围 `0` 到页数减 1，越界按边界收敛展示 |
| `autoplay`     | `boolean` | `false`   |  否  | 页数小于 2 时不启动自动播放                                           |
| `interval`     | `number`  | `3000`    |  否  | 自动播放间隔毫秒数；自动播放开关、间隔、页数、当前页任一变化后重新计时，手动切换同样重新计时 |
| `loop`         | `boolean` | `true`    |  否  | `false` 时切换停在首 / 末页，对应箭头禁用                             |
| `arrows`       | `boolean` | `false`   |  否  | 显示左右两个悬浮圆钮箭头                                              |
| `dots`         | `boolean` | `true`    |  否  | 显示底部居中的指示器圆点，激活项为胶囊形态                            |

## 方法与事件

| 事件                 | 签名                                        | 触发条件                                                       |
| -------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| `update:activeIndex` | `(index: number) => void`                   | 页索引变化（`v-model:active-index` 自动监听）                  |
| `change`             | `(current: number, prev: number) => void`   | 页索引变化后触发，参数为新索引与旧索引；自动播放与手动切换都会触发 |

组件无暴露方法；需要程序化切换时直接改 `activeIndex` 绑定值。

## 典型示例

### 基本用法：箭头、圆点与受控索引

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UCarousel, UCarouselItem } from '@veltra/desktop'

const active = shallowRef(0)
</script>

<template>
  <div>
    <u-carousel v-model:active-index="active" arrows>
      <u-carousel-item v-for="page in 4" :key="page">
        <div class="page">第 {{ page }} 页</div>
      </u-carousel-item>
    </u-carousel>
    <p>当前页：{{ active + 1 }}</p>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  background: #2b587c;
  color: #fff;
  font-size: 24px;
}
</style>
```

### 自动播放与间隔

```vue
<script setup lang="ts">
import { UCarousel, UCarouselItem } from '@veltra/desktop'
</script>

<template>
  <!-- 每 2 秒切到下一页，末页后循环回首页；手动点箭头 / 圆点后重新计时 -->
  <u-carousel autoplay :interval="2000" arrows>
    <u-carousel-item v-for="page in 4" :key="page">
      <div class="page">第 {{ page }} 页</div>
    </u-carousel-item>
  </u-carousel>
</template>

<style scoped>
.page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  background: #4d7ea8;
  color: #fff;
  font-size: 24px;
}
</style>
```

### 非循环与隐藏指示器

```vue
<script setup lang="ts">
import { UCarousel, UCarouselItem } from '@veltra/desktop'
</script>

<template>
  <!-- 非循环：首 / 末页处对应箭头禁用 -->
  <u-carousel :loop="false" arrows>
    <u-carousel-item v-for="page in 3" :key="page">
      <div class="page">第 {{ page }} 页</div>
    </u-carousel-item>
  </u-carousel>

  <!-- 隐藏指示器，仅自动播放 -->
  <u-carousel :dots="false" autoplay>
    <u-carousel-item v-for="page in 3" :key="page">
      <div class="page">第 {{ page }} 页</div>
    </u-carousel-item>
  </u-carousel>
</template>

<style scoped>
.page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  background: #7aa5c2;
  color: #fff;
  font-size: 24px;
}
</style>
```

## 注意事项

> [!WARNING]
>
> - 本库双向绑定属性是 `activeIndex`（`v-model:active-index`），不是 AntD 的 `current`、也不是 Element Plus 的默认 `v-model`；自动播放间隔属性是 `interval`（毫秒），不是 AntD 的 `autoplaySpeed`。
> - 箭头开关是 `arrows`、指示器开关是 `dots`；没有 AntD 的 `dotPosition`（指示器固定底部居中）、`effect="fade"` 渐现与 `waitForAnimate`，也没有 Element Plus 的 `type="card"` 卡片模式与 `height` 定高属性——组件高度由页内容决定，需要定高时给页内容设置高度。
> - 循环回绕（末页 → 首页、首页 → 末页）是一次过渡直接滑到目标位置，不克隆首尾页做无缝衔接；回绕过渡会扫过中间页。
> - 组件不定高：各页高度不一致时以最高页撑开容器，矮页内容顶部对齐。
> - 切换动画时长与缓动取主题 token（`--u-transition-slow` 与 `--u-transition-ease-out`），没有 `duration` / `easing` 属性；改主题即改全局轮播动效。
> - 页数小于 2 时自动播放不启动；`activeIndex` 越界时展示按边界收敛，回写值仍为传入值。
