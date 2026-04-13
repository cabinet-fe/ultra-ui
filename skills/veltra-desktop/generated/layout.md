# 布局容器

## layout (ULayout)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/layout.ts
import type { DeconstructValue } from '@veltra/utils'

/** 布局组件属性 */
export interface LayoutProps {
  /**
   * 元素标签
   * @default "div"
   */
  tag?: string
  /** 间距 */
  gap?: number | string
  /**
   * 每个列的布局
   * @example
   * ```ts
   * // 以下都是合法的值
   * const cols = '200px 1fr'
   * const cols = ['200px', '1fr']
   * ```
   * [fr是什么?](https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex_value)
   */
  cols?: string[] | string

  /**
   * 每一行的布局
   * @example
   * ```ts
   * // 以下都是合法的值
   * const rows = '200px 1fr'
   * const rows = ['200px', '1fr']
   * ```
   * [fr是什么?](https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex_value)
   */
  rows?: string[] | string
  /**
   * 尺寸是否可调节
   * @default false
   * @description 注意：当为true时，gap固定且需要有一项宽度为固定像素才能够拖拽
   */
  resizable?: boolean
}

/** 布局组件定义的事件 */
export interface LayoutEmits {}

/** 布局组件暴露的属性和方法(组件内部使用) */
export interface _LayoutExposed {}

/** 布局组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type LayoutExposed = DeconstructValue<_LayoutExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/layout/index.vue -->
<template>
  <div>
    <h3>两栏布局</h3>
    <u-layout cols="200px 1fr" class="layout">
      <aside class="aside"></aside>
      <main class="main"></main>
    </u-layout>

    <h3>三栏布局</h3>
    <u-layout cols="60px 200px 1fr" class="layout">
      <div class="nav"></div>
      <aside class="aside"></aside>
      <main class="main"></main>
    </u-layout>

    <h3>布局示例</h3>
    <u-layout cols="60px 200px 1fr">
      <div class="nav"></div>
      <aside class="aside"></aside>
      <main class="main">
        <nav class="menu-bar"></nav>
        <div class="content"></div>
      </main>
    </u-layout>

    <h3>尺寸可调节</h3>
    <u-layout cols="300px 1fr 300px" resizable>
      <div class="nav"></div>
      <aside class="aside"></aside>
      <main class="main"></main>
    </u-layout>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.nav,
.aside,
.main {
  height: 600px;
}
.nav {
  background-color: rgb(113, 152, 139);
}
.aside {
  background-color: #ccc;
}

.main {
  background-color: #f2f2f2;
}

.menu-bar {
  height: 60px;
  box-shadow: 0 2px 4px rgba($color: #000000, $alpha: 0.1);
  background-color: #fff;
}

.content {
  height: calc(100% - 60px);
}
</style>
```

## card (UCard, UCardHeader, UCardCover, UCardContent, UCardAction)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/card.ts
import type { ComponentProps, DeconstructValue } from '@veltra/utils'

/** 卡片组件属性 */
export interface CardProps extends ComponentProps {
  /** 宽度 */
  width?: string | number

  /** 融合样式，卡片不再有阴影 */
  integrate?: boolean
}

export interface CardActionProps {
  /** 右对齐 */
  alignRight?: boolean
}

export interface CardContentProps {
  /** 封面模式 */
  cover?: boolean
}

export interface CardCoverProps {
  /** 封面图片地址 */
  src: string
  /** 封面高度 */
  height?: string | number
}

export interface CardEmits {}

export interface _CardExposed {}

export type CardExposed = DeconstructValue<_CardExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/card/custom-card.vue -->
<template>
  <u-card class="custom-card">
    <u-card-header v-if="title"> {{ title }} </u-card-header>

    <u-card-content :style="{ height, overflow: 'auto' }">
      <slot />
    </u-card-content>
  </u-card>
</template>

<script lang="ts" setup>
defineProps<{
  title?: string
  height?: string
}>()
</script>

<style lang="scss" scoped>
.custom-card {
  margin-bottom: 20px;
}
</style>
```

```vue
<!-- 来源: playgrounds/desktop/src/card/index.vue -->
<template>
  <div>
    <u-card width="400">
      <u-card-header> 卡片标题 </u-card-header>

      <u-card-content>
        愿您在新的一年里，龙飞凤舞 龙潭虎穴， 龙腾虎跃， 龙马精神， 龙钟虎踞， 龙争虎斗， 龙章凤函，
        一龙一飞， 亢龙有悔， 龙潭虎渊， 龙行虎步， 龙神凤雏， 龙战虎争， 龙屈虎伏， 龙腾虎跃，
        龙蟠虎踞， 龙腾虎踞， 龙腾虎跃， 龙腾凤集， 龙腾虎跃！
      </u-card-content>

      <u-card-action align-right>
        <u-button type="primary" text>返回</u-button>
        <u-button type="primary">确认</u-button>
      </u-card-action>
    </u-card>

    <u-card width="400" integrate>
      <u-card-header> 融合卡片 </u-card-header>

      <u-card-content>
        愿您在新的一年里，龙飞凤舞 龙潭虎穴， 龙腾虎跃， 龙马精神， 龙钟虎踞， 龙争虎斗， 龙章凤函，
        一龙一飞， 亢龙有悔， 龙潭虎渊， 龙行虎步， 龙神凤雏， 龙战虎争， 龙屈虎伏， 龙腾虎跃，
        龙蟠虎踞， 龙腾虎踞， 龙腾虎跃， 龙腾凤集， 龙腾虎跃！
      </u-card-content>

      <u-card-action align-right>
        <u-button type="primary" text>返回</u-button>
        <u-button type="primary">确认</u-button>
      </u-card-action>
    </u-card>

    <u-card width="400">
      <u-card-cover
        src="http://5b0988e595225.cdn.sohucs.com/images/20190625/2a57bb7082f84e33b53dd79b30b949df.jpeg"
      />

      <u-card-action style="display: flex; justify-content: space-between; align-items: center">
        <u-text :max-rows="1" as="title"> 卡片描述 </u-text>
        <button-common-props tag="span" size="small" :loading="loading">
          <u-button v-for="btn of buttons" :icon="btn.icon" :type="btn.type" @click="handleClick" />
        </button-common-props>
      </u-card-action>
    </u-card>
  </div>
</template>

<script setup lang="ts">
import { useComponentProps } from '@veltra/compositions'
import type { ButtonProps } from '@veltra/desktop'
import { Lock, MoreFilled, Star } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

const ButtonCommonProps = useComponentProps<ButtonProps>({
  circle: true,
  // type: 'primary',
  // text: true,
  iconSize: 18,
  loading: false
})

const buttons = [
  { type: 'primary', icon: Star },
  { type: 'warning', icon: Lock },
  { icon: MoreFilled }
]

const loading = shallowRef(false)

function handleClick() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
}
</script>

<style lang="scss" scoped>
div {
  & > .u-card {
    margin-bottom: 10px;
  }
}
</style>
```

## scroll (UScroll)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/scroll.ts
import type { DeconstructValue } from '@veltra/utils'
import type { CSSProperties, ShallowRef } from 'vue'

export type ScrollPosition = {
  /** 横向位置 */
  x?: number
  /** 纵向位置 */
  y?: number
  /** 横向滚动宽度 */
  sw?: number
  /** 纵向滚动高度 */
  sh?: number
  /** 横向可视宽度 */
  cw?: number
  /** 纵向可视高度 */
  ch?: number
}

/** 滚动条组件属性 */
export interface ScrollProps {
  /**
   * 容器元素标签名
   * @default div
   */
  tag?: string
  /**
   * 容器高度
   * @default 100%
   */
  height?: string | number

  /**
   * 总是显示滚动条
   * @default false
   */
  always?: boolean

  /**
   * 内容样式
   */
  contentStyle?: string | CSSProperties

  /**
   * 容器样式
   */
  containerStyle?: string | CSSProperties

  /** 内容类名 */
  contentClass?: unknown

  /** 容器类名 */
  containerClass?: string | string[]

  /** 拖拽防抖时间 */
  dragDebounce?: number
}

export interface ScrollEmits {
  /** 滚动事件 */
  (e: 'scroll', position: Required<ScrollPosition>): void
  /** 尺寸调整事件 */
  (e: 'resize', targets: HTMLElement[]): void
}

export interface _ScrollExposed {
  /**
   * 滚动至
   * @param position 位置
   */
  scrollTo(position: ScrollPosition): void

  /**
   * 更新滚动条状态
   */
  update(): void

  /** 滚动内容元素引用 */
  contentRef: ShallowRef<HTMLElement | undefined>

  /** 滚动容器元素引用 */
  containerRef: ShallowRef<HTMLElement | undefined>

  /** 滚动容器元素引用 */
  el: ShallowRef<HTMLElement | undefined>
}

export type ScrollExposed = DeconstructValue<_ScrollExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/scroll/index.vue -->
<template>
  <div>
    <u-scroll style="padding: 10px" tag="div" class="scroll" ref="scrollbarRef" always>
      <ul>
        <li style="width: 2000px" v-for="i of 200" :key="i">
          {{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
          }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
          }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
          }}{{ i }}{{ i }}
        </li>
      </ul>

      <u-dropdown min-width="200px" trigger="click">
        <template #trigger>
          <u-button>aaaaa</u-button>
        </template>

        <template #content>
          <div>11111</div>
          <div>11111</div>
          <div>11111</div>
          <div>11111</div>
          <div>11111</div>
        </template>
      </u-dropdown>
    </u-scroll>

    <u-button @click="scrollToTop">滚动到顶部</u-button>
    <u-button @click="scrollToLeft">滚动到左侧</u-button>
  </div>
</template>

<script lang="ts" setup>
import type { ScrollExposed } from '@veltra/desktop'
import { shallowRef } from 'vue'

const scrollbarRef = shallowRef<ScrollExposed>()

function scrollToTop() {
  scrollbarRef.value?.scrollTo({
    y: 0
  })
}

function scrollToLeft() {
  scrollbarRef.value?.scrollTo({
    x: 0
  })
}
</script>

<style lang="scss">
.header,
.footer {
  height: 60px;
  flex-shrink: 0;
}
.scroll {
  border: var(--u-border);
  flex-grow: 1;
  height: 20vh;
}
</style>
```

## watermark (UWatermark)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/watermark.ts
import type { DeconstructValue } from '@veltra/utils'

/** watermark组件属性 */
export interface WatermarkProps {
  /** 文字 */
  text?: string
  /** 图片 */
  image?: string
  /** 是否传送到body下 */
  appendToBody?: boolean
  /** 旋转弧度 */
  route?: number
  /** 字体大小 */
  fontSize?: number
}

/** watermark组件定义的事件 */
export interface WatermarkEmits {}

/** watermark组件暴露的属性和方法(组件内部使用) */
export interface _WatermarkExposed {}

/** watermark组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type WatermarkExposed = DeconstructValue<_WatermarkExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/watermark/index.vue -->
<template>
  <div>
    <div>水印</div>
    <u-watermark text="丹书铁卷菠萝梦" append-to-body :route="-30"> </u-watermark>

    <!-- <u-watermark
      image="https://q9.itc.cn/q_70/images01/20240325/c8916e957ea944a38df28e911e117a5f.png"
    >
      111111
      <p v-for="item in list">
        {{ item }}
      </p>
    </u-watermark> -->
  </div>
</template>

<script lang="ts" setup>
const list = [] as any
for (var i = 0; i <= 100; i++) {
  list.push(
    '水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印'
  )
}
</script>

<style lang="scss" scoped></style>
```
