# UProgress 示例

## 基础条形进度

```vue
<u-progress :percentage="0" />
<u-progress :percentage="30" type="success" />
<u-progress :percentage="60" type="info" />
<u-progress :percentage="100" type="danger" />
```

## 动态着色

```vue
<u-progress
  :percentage="85"
  :type="(p) => (p >= 80 ? 'danger' : p >= 50 ? 'warning' : 'primary')"
/>
```

## 环形进度条

```vue
<u-progress :percentage="45" circle />
<u-progress :percentage="75" circle type="success" :size="200" />
<u-progress :percentage="100" circle type="danger" />
```

## 自定义插槽内容

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
