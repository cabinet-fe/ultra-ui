# ULayout — 栅格布局

> `import type { LayoutProps } from '@veltra/desktop'`

基于 CSS Grid 的布局容器组件，支持行列定义、间距、列宽拖拽调节。

## Import

```ts
// ULayout 由 Vite 自动导入，无需手动 import
```

## Props

| prop        | type                 | default | 说明                                                                             |
| ----------- | -------------------- | ------- | -------------------------------------------------------------------------------- |
| `tag`       | `string`             | `'div'` | 渲染标签                                                                         |
| `gap`       | `number \| string`   | —       | 列间距（`resizable` 时固定为 `10px`）                                            |
| `cols`      | `string[] \| string` | —       | 列定义，对应 `grid-template-columns`，支持 `fr`、`px`、`%` 等                    |
| `rows`      | `string[] \| string` | —       | 行定义，对应 `grid-template-rows`                                                |
| `resizable` | `boolean`            | `false` | 是否可拖拽调节列宽。开启后 `gap` 固定 10px，且需至少有一列为固定像素宽度才能拖拽 |

## Emits

无。

## Slots

| slot      | 作用域 | 说明                                  |
| --------- | ------ | ------------------------------------- |
| `default` | —      | 布局内容，每个直接子元素占据一个 cell |

## Exposed

无。

## Examples

### 基础列布局

```vue
<u-layout cols="200px 1fr" :gap="16">
  <div>侧边栏（固定 200px）</div>
  <div>主内容区（自适应）</div>
</u-layout>
```

### 相等分栏

```vue
<u-layout :cols="['1fr', '1fr', '1fr']" :gap="12">
  <div>列一</div>
  <div>列二</div>
  <div>列三</div>
</u-layout>
```

### 行布局

```vue
<u-layout rows="auto 1fr auto" style="height: 100vh">
  <header>页头</header>
  <main>内容</main>
  <footer>页脚</footer>
</u-layout>
```

### 可拖拽调整列宽

```vue
<u-layout cols="240px 1fr 320px" resizable>
  <div>左侧面板</div>
  <div>中间主区域</div>
  <div>右侧面板</div>
</u-layout>
```

### 行列组合

```vue
<u-layout :cols="['200px', '1fr']" rows="60px 1fr">
  <div>左上</div>
  <div>右上</div>
  <div>左下</div>
  <div>右下</div>
</u-layout>
```

### 自定义标签

```vue
<u-layout tag="section" cols="1fr 1fr" :gap="24">
  <div>区域一</div>
  <div>区域二</div>
</u-layout>
```

### 动态列数

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

const count = ref(3)
const cols = computed(() => Array.from({ length: count.value }, () => '1fr'))
</script>

<template>
  <u-button @click="count = Math.max(1, count - 1)">-</u-button>
  {{ count }}
  <u-button @click="count++">+</u-button>
  <u-layout :cols="cols" :gap="8">
    <div v-for="i in count" :key="i">第 {{ i }} 列</div>
  </u-layout>
</template>
```

---

# ULayoutResizer — 拖拽调节条（内部）

> 不被导出，由 `ULayout` 内部使用。

列宽拖拽时的分隔条，支持垂直（列间）拖拽。基于 `useDrag` 实现。

## Props

| prop         | type      | default | 说明                                     |
| ------------ | --------- | ------- | ---------------------------------------- |
| `horizontal` | `boolean` | —       | 是否横向拖拽（行间），当前仅支持垂直方向 |
| `offset`     | `number`  | —       | 默认定位偏移量（px）                     |

## Emits

| event          | 参数               | 说明                       |
| -------------- | ------------------ | -------------------------- |
| `resize`       | `(offset: number)` | 拖拽距离（相对起点的偏移） |
| `resize-start` | —                  | 拖拽开始                   |
| `resize-end`   | —                  | 拖拽结束                   |

## Exposed

```ts
interface ULayoutResizerExposed {
  /** 更新分隔条位置偏移量 */
  update(offset: number): void
}
```
