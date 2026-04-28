# UBadge — 徽标

> `import type { BadgeProps } from '@veltra/desktop'`

在子元素右上角显示数字或圆点。

## Import

```ts
import { UBadge } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `value` | `number` | — | 显示数值 |
| `type` | `ColorType` | — | 颜色类型 |
| `color` | `string` | — | 自定义背景色（CSS 值） |
| `max` | `number` | `99` | 最大值，超出显示 `{max}+` |
| `dot` | `boolean` | — | 仅显示圆点（不显数值） |
| `hidden` | `boolean` | — | 隐藏徽标 |
| `size` | `ComponentSize` | `'default'` | 尺寸 |

## Examples

### 基础使用

```vue
<u-badge :value="5">
  <u-button>消息</u-button>
</u-badge>

<u-badge :value="10" type="primary">
  <u-button>通知</u-button>
</u-badge>
```

### 超出最大值

```vue
<u-badge :value="120" type="danger">
  <u-button>评论</u-button>  <!-- 显示 99+ -->
</u-badge>

<u-badge :value="50" :max="49" type="info">
  <u-button>消息</u-button>  <!-- 显示 49+ -->
</u-badge>
```

### 圆点模式 + 自定义颜色

```vue
<u-badge dot type="danger">
  <span>未读消息</span>
</u-badge>

<u-badge :value="9" color="#ff6b6b">
  <u-button>自定义色</u-button>
</u-badge>
```
