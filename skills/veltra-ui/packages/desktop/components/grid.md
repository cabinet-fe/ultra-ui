# UGrid — 栅格布局

> `import type { GridProps, GridEmits, GridExposed, GridItemProps, Breakpoint, BreakCols } from '@veltra/desktop'`

基于 CSS Grid 的响应式栅格布局系统，支持断点自适应列数、动态跨距，通过 `UGrid` + `UGridItem` 组合使用。断点阈值：`xs`(578px)、`sm`(960px)、`md`(1366px)、`lg`(1920px)、`xl`。

## Import

```ts
// UGrid、UGridItem 由 Vite 自动导入，无需手动 import
```

## UGrid Props

| prop   | type                                                          | default | 说明                                                                                                    |
| ------ | ------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `cols` | `number \| BreakCols \| ((breakpoint: Breakpoint) => number)` | `24`    | 栅格列数。数字指定固定列数；对象按断点分别配置列数；函数根据断点（含 `name`、`level` 字段）动态返回列数 |
| `tag`  | `string`                                                      | `"div"` | 根容器标签                                                                                              |
| `gap`  | `number \| string`                                            | —       | 间隔。数字时同步设置行列间隔（`px`）；字符串 `"<row> <col>"` 可分别指定行间隔和列间隔，如 `"10px 20px"` |

### BreakCols 类型

```ts
interface BreakCols {
  xs?: number // width < 578px
  sm?: number // width < 960px
  md?: number // width < 1366px
  lg?: number // width < 1920px
  xl?: number // width >= 1920px
  default?: number // 默认，当高断点未配置时回退使用
}
```

断点查找逻辑：优先匹配当前断点 key，未配则向上寻找更大断点的配置，最终回退到 `default` → `24`。

## UGrid Emits

| event               | 参数                       | 说明                                                                                                  |
| ------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `resize`            | `(rect: DOMRect)`          | 容器尺寸变化时触发                                                                                    |
| `breakpoint-change` | `(breakpoint: Breakpoint)` | 容器宽度跨越断点阈值时触发，`Breakpoint = { name: 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl', level: 1-5 }` |

## UGrid Slots

| slot      | 作用域 | 说明                          |
| --------- | ------ | ----------------------------- |
| `default` | —      | 放置 `UGridItem` 作为栅格子项 |

## UGrid Exposed

```ts
interface GridExposed {
  /** 根容器元素引用（已自动解构为原始值） */
  el: HTMLElement | null
}
```

---

## Sub-component: UGridItem — 栅格子项

`UGridItem` 必须作为 `UGrid` 的直接子节点使用，否则会在控制台输出警告。

### UGridItem Props

| prop   | type                                                                                     | default | 说明                                                                                            |
| ------ | ---------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `span` | `number \| 'full' \| { [BreakpointName]?: number \| 'full'; default: number \| 'full' }` | `1`     | 所占列数。`0` 表示隐藏该项；`'full'` 表示撑满整行；对象可按断点配置不同跨距，`default` 为回退值 |
| `tag`  | `string`                                                                                 | `"div"` | 根容器标签                                                                                      |

### UGridItem Slots

| slot      | 作用域 | 说明     |
| --------- | ------ | -------- |
| `default` | —      | 子项内容 |

---

## Examples

### 固定列数

```vue
<u-grid :cols="24" :gap="16">
  <u-grid-item :span="12"><div style="background: var(--u-color-primary-light); padding: 16px">span 12</div></u-grid-item>
  <u-grid-item :span="12"><div style="background: var(--u-color-primary-light); padding: 16px">span 12</div></u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">span 8</div></u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">span 8</div></u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">span 8</div></u-grid-item>
</u-grid>
```

### 响应式断点列数 + 响应式跨距

```vue
<u-grid :cols="{ xs: 4, sm: 8, md: 12, lg: 24 }" :gap="12">
  <u-grid-item :span="{ xs: 4, sm: 6, md: 8, lg: 6, default: 24 }">
    <div style="background: var(--u-color-primary-light); padding: 12px">响应式跨距</div>
  </u-grid-item>
  <u-grid-item :span="{ xs: 2, sm: 4, md: 6, lg: 6, default: 12 }">
    <div style="background: var(--u-color-primary-light); padding: 12px">另一列</div>
  </u-grid-item>
</u-grid>
```

### 函数动态列数 + 满行跨距

```vue
<u-grid :cols="(bp) => (bp.level < 3 ? 12 : 24)" :gap="16">
  <u-grid-item span="full">
    <div style="background: var(--u-color-primary-light); padding: 16px">整行标题</div>
  </u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">A</div></u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">B</div></u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">C</div></u-grid-item>
</u-grid>
```

### 监听断点变化

```vue
<template>
  <u-grid :cols="{ xs: 6, md: 12, lg: 24 }" @breakpoint-change="onBreakpointChange">
    <u-grid-item :span="{ xs: 6, md: 6, default: 12 }">
      <div style="background: var(--u-color-primary-light); padding: 12px">
        当前断点: {{ bp?.name }}({{ bp?.level }})
      </div>
    </u-grid-item>
  </u-grid>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Breakpoint } from '@veltra/desktop'

const bp = ref<Breakpoint>()

function onBreakpointChange(b: Breakpoint) {
  bp.value = b
}
</script>
```
