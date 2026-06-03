# Base Styles

## Normalize

在应用入口导入一次。

```ts
import '@veltra/styles/normalize'
```

## Transitions

可以在应用入口一起导入。

```ts
import '@veltra/styles/transitions'
```

也可以在组件中按需导入。

```ts
import '@veltra/styles/transitions/fade.css'
```

在 `Transition` 组件中使用。

```vue
<Transition name="fade" mode="out-in">
  <div v-if="visible">...</div>
</Transition>
```

可用 name：

| name                             | 用途         |
| -------------------------------- | ------------ |
| `fade`                           | 淡入淡出     |
| `slide-down` / `slide-up`        | 垂直滑入     |
| `spring`                         | 弹性缩放     |
| `zoom-in`                        | 中心缩放     |
| `zoom-in-left` / `zoom-in-right` | 水平方向缩放 |
| `zoom-in-top` / `zoom-in-bottom` | 垂直方向缩放 |
