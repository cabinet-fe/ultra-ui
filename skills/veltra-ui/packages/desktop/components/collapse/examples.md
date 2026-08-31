# UCollapse 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const active = ref<CollapseModelValue>(['1'])
</script>

<template>
  <u-collapse v-model="active">
    <u-collapse-item value="1" title="标题 1">内容 1</u-collapse-item>
    <u-collapse-item value="2" title="标题 2">内容 2</u-collapse-item>
    <u-collapse-item value="3" title="标题 3">内容 3</u-collapse-item>
  </u-collapse>
</template>
```

## 手风琴模式

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const active = ref<CollapseModelValue>('a')
</script>

<template>
  <!-- accordion 模式下 modelValue 为单值。每项为独立边框卡片 -->
  <u-collapse v-model="active" accordion>
    <u-collapse-item value="a" title="常规设置">…</u-collapse-item>
    <u-collapse-item value="b" title="高级配置">…</u-collapse-item>
    <u-collapse-item value="c" title="关于" disabled>…</u-collapse-item>
  </u-collapse>
</template>
```

## 自定义头部（#header 插槽）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Star } from '@veltra/icons/normal'
import type { CollapseModelValue } from '@veltra/desktop'

const active = ref<CollapseModelValue>(['1'])
</script>

<template>
  <u-collapse v-model="active">
    <!-- #header 只替换标题区；展开图标始终由组件渲染，活动态旋转 180° -->
    <u-collapse-item value="1">
      <template #header>
        <span style="display:inline-flex;align-items:center;gap:6px">
          <u-icon><Star /></u-icon>
          收藏夹
        </span>
      </template>
      收藏内容
    </u-collapse-item>

    <!-- 不提供 #header 时渲染 title 文本 + 展开图标 -->
    <u-collapse-item value="2" title="默认头部"> 默认头部的展开图标随状态旋转 </u-collapse-item>
  </u-collapse>
</template>
```

## 默认展开与全部折叠（default-collapse-all）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const activeExpand = ref<CollapseModelValue>()
const activeCollapse = ref<CollapseModelValue>()
</script>

<template>
  <!-- default-collapse-all 默认为 false，未传递绑定初始值时默认展开全部折叠项 -->
  <u-collapse v-model="activeExpand">
    <u-collapse-item value="x1" title="模块 A">默认全部展开</u-collapse-item>
    <u-collapse-item value="x2" title="模块 B">默认全部展开</u-collapse-item>
  </u-collapse>

  <!-- 显式配置 default-collapse-all 后，即使没有初始绑定值，组件也会默认折叠收起所有项 -->
  <u-collapse v-model="activeCollapse" default-collapse-all>
    <u-collapse-item value="y1" title="模块 A">初始化默认为折叠收起状态</u-collapse-item>
    <u-collapse-item value="y2" title="模块 B">只有手动点击头部才会展开</u-collapse-item>
  </u-collapse>
</template>
```

## 独立使用（v-model）

不包裹在 `UCollapse` 内时，可用 `v-model`（boolean）控制单项展开；`value` 无需填写，样式与动画与组合用法一致。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const expanded = ref(false)
</script>

<template>
  <u-collapse-item v-model="expanded" title="独立折叠项"> 展开后的内容 </u-collapse-item>
</template>
```
