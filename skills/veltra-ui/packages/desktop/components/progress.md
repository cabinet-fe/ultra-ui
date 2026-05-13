# UProgress — 进度条

> `import type { ProgressProps } from '@veltra/desktop'`

展示当前任务进度的条形或环形进度指示器，支持语义颜色类型、百分比动态着色、自定义插槽内容。

## Import

```ts
// UProgress 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `type` | `ColorType \| ((percentage: number) => ColorType)` | `'primary'` | `'primary'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`，或根据百分比动态返回颜色类型的函数 |
| `size` | `number \| string` | — | 圆形进度条的宽高，条形模式无效 |
| `percentage` | `number` | — | 当前进度百分比（0 ~ 100），超出部分自动裁剪 |
| `circle` | `boolean` | `false` | `true` 时显示环形进度条 |

## Emits

无事件。

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ percentage: number; type: ColorType }` | 自定义进度指示文本内容，默认为 `percentage%` |

## Exposed

```ts
interface ProgressExposed {}
```

## Examples

### 基础条形进度

```vue
<u-progress :percentage="0" />
<u-progress :percentage="30" type="success" />
<u-progress :percentage="60" type="info" />
<u-progress :percentage="100" type="danger" />
```

### 动态着色

```vue
<u-progress
  :percentage="85"
  :type="(p) => (p >= 80 ? 'danger' : p >= 50 ? 'warning' : 'primary')"
/>
```

### 环形进度条

```vue
<u-progress :percentage="45" circle />
<u-progress :percentage="75" circle type="success" :size="200" />
<u-progress :percentage="100" circle type="danger" />
```

### 自定义插槽内容

```vue
<u-progress :percentage="68">
  <template #default="{ percentage, type }">
    <span :style="{ color: `var(--u-color-${type})` }">
      {{ percentage >= 100 ? '完成' : `${percentage}%` }}
    </span>
  </template>
</u-progress>

<u-progress :percentage="72" circle :size="120">
  <template #default="{ percentage }">
    <span style="font-size: 24px; font-weight: 600">{{ percentage }}%</span>
  </template>
</u-progress>
```
