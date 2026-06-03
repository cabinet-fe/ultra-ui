# UBadge 示例

## 基础使用

```vue
<u-badge :value="5">
  <u-button>消息</u-button>
</u-badge>

<u-badge :value="10" type="primary">
  <u-button>通知</u-button>
</u-badge>
```

## 超出最大值

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

## 圆点模式 + 自定义颜色

```vue
<u-badge dot type="danger">
  <span>未读消息</span>
</u-badge>

<u-badge :value="9" color="#ff6b6b">
  <u-button>自定义背景色</u-button>
</u-badge>
```

## 文本值 + 隐藏

```vue
<u-badge value="NEW" type="success">
  <u-button>活动</u-button>
</u-badge>

<u-badge :value="0" :hidden="count === 0">
  <u-button>待处理</u-button>
</u-badge>
```
