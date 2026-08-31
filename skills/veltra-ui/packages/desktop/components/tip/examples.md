# UTip 示例

## hover 触发

```vue
<template>
  <u-tip content="这是一段提示文本">
    <u-button>悬停查看</u-button>
  </u-tip>
</template>
```

## click 触发

```vue
<template>
  <u-tip content="点击后显示的提示" trigger="click">
    <u-button>点击查看</u-button>
  </u-tip>
</template>
```

## 自定义触发元素

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'

const customEl = useTemplateRef('customEl')
</script>

<template>
  <u-tip content="提示文本" :trigger-dom="customEl">
    <span>这段文本不会作为定位基准</span>
  </u-tip>
  <div ref="customEl">实际定位基准元素</div>
</template>
```

## 自定义方向和对齐

```vue
<template>
  <u-tip content="提示内容" direction="bottom" alignment="start">
    <u-button>底部对齐</u-button>
  </u-tip>
</template>
```

## 隐藏箭头

```vue
<template>
  <u-tip content="无箭头的提示" :hide-arrow="true">
    <u-button>无箭头</u-button>
  </u-tip>
</template>
```

## 受控显隐

```vue
<template>
  <u-tip content="受控提示" :visible="visible" @update:visible="visible = $event">
    <u-button>受控显示</u-button>
  </u-tip>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const visible = ref(false)
</script>
```

## 禁用状态

```vue
<template>
  <u-tip content="这段提示不会显示" disabled>
    <u-button>禁用提示</u-button>
  </u-tip>
</template>
```

## 弹出延时

```vue
<template>
  <u-tip content="悬停 500ms 后弹出" :show-delay="500">
    <u-button>延迟弹出</u-button>
  </u-tip>
</template>
```
