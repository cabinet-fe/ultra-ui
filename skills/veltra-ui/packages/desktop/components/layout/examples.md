# ULayout 示例

## 基础列布局

```vue
<u-layout cols="200px 1fr" :gap="16">
  <div>侧边栏（固定 200px）</div>
  <div>主内容区（自适应）</div>
</u-layout>
```

## 相等分栏

```vue
<u-layout :cols="['1fr', '1fr', '1fr']" :gap="12">
  <div>列一</div>
  <div>列二</div>
  <div>列三</div>
</u-layout>
```

## 行布局

```vue
<u-layout rows="auto 1fr auto" style="height: 100vh">
  <header>页头</header>
  <main>内容</main>
  <footer>页脚</footer>
</u-layout>
```

## 可拖拽调整列宽

```vue
<u-layout cols="240px 1fr 320px" resizable>
  <div>左侧面板</div>
  <div>中间主区域</div>
  <div>右侧面板</div>
</u-layout>
```

## 行列组合

```vue
<u-layout :cols="['200px', '1fr']" rows="60px 1fr">
  <div>左上</div>
  <div>右上</div>
  <div>左下</div>
  <div>右下</div>
</u-layout>
```

## 自定义标签

```vue
<u-layout tag="section" cols="1fr 1fr" :gap="24">
  <div>区域一</div>
  <div>区域二</div>
</u-layout>
```

## 动态列数

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

## 动态列数（续）

```ts
interface ULayoutResizerExposed {
  /** 更新分隔条位置偏移量 */
  update(offset: number): void
}
```
