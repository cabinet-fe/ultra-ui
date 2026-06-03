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
<template>
  <!-- accordion 模式下 modelValue 为单值。每个折叠项表现为独立的精致胶囊卡片 -->
  <u-collapse v-model="active" accordion>
    <u-collapse-item value="a" title="常规设置">…</u-collapse-item>
    <u-collapse-item value="b" title="高级配置">…</u-collapse-item>
    <u-collapse-item value="c" title="关于" disabled>…</u-collapse-item>
  </u-collapse>
</template>
```

## 自定义图标与标题

```vue
<script setup lang="ts">
import { Star, ArrowDown } from '@veltra/icons/normal'
</script>

<template>
  <u-collapse v-model="active" :expand-icon="ArrowDown">
    <u-collapse-item value="1">
      <template #title>
        <span style="display:inline-flex;align-items:center;gap:6px">
          <u-icon><Star /></u-icon>
          收藏夹
        </span>
      </template>
      收藏内容
    </u-collapse-item>

    <u-collapse-item value="2" title="动态图标">
      <template #icon="{ isActive }">
        <u-icon :style="{ color: isActive ? 'var(--u-color-primary)' : '' }">
          <ArrowDown />
        </u-icon>
      </template>
      根据展开状态切换图标样式
    </u-collapse-item>
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
