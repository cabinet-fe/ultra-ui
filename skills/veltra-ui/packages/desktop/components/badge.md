# UBadge — 徽标

> `import type { BadgeProps, BadgeEmits, BadgeExposed } from '@veltra/desktop'`

在子元素右上角显示数字、文本或圆点。

## Import

```ts
// UBadge 由 Vite 自动导入，无需手动 import
```

## Props

| prop     | type               | default     | 说明                                                              |
| -------- | ------------------ | ----------- | ----------------------------------------------------------------- |
| `value`  | `number \| string` | —           | 显示值                                                            |
| `type`   | `ColorType`        | —           | 颜色类型：`'primary'` `'info'` `'success'` `'warning'` `'danger'` |
| `color`  | `string`           | —           | 自定义背景色（CSS 颜色值）                                        |
| `max`    | `number`           | `99`        | 最大值，超出后显示 `{max}+`                                       |
| `dot`    | `boolean`          | —           | 仅显示小圆点，不显示数值                                          |
| `hidden` | `boolean`          | —           | 隐藏徽标                                                          |
| `size`   | `ComponentSize`    | `'default'` | 组件尺寸：`'small'` `'default'` `'large'`                         |

## Emits

| event               | payload           | 说明           |
| ------------------- | ----------------- | -------------- |
| `update:modelValue` | `(value: string)` | 当值变化时触发 |

## Slots

| slot      | 作用域 | 说明                       |
| --------- | ------ | -------------------------- |
| `default` | —      | 默认插槽，徽标所附着的内容 |

## Exposed

```ts
interface BadgeExposed {}
```

无暴露成员。

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
  <u-button>评论</u-button>
  <!-- 显示 99+ -->
</u-badge>

<u-badge :value="50" :max="49" type="info">
  <u-button>消息</u-button>
  <!-- 显示 49+ -->
</u-badge>
```

### 圆点模式 + 自定义颜色

```vue
<u-badge dot type="danger">
  <span>未读消息</span>
</u-badge>

<u-badge :value="9" color="#ff6b6b">
  <u-button>自定义背景色</u-button>
</u-badge>
```

### 文本值 + 隐藏

```vue
<u-badge value="NEW" type="success">
  <u-button>活动</u-button>
</u-badge>

<u-badge :value="0" :hidden="count === 0">
  <u-button>待处理</u-button>
</u-badge>
```
