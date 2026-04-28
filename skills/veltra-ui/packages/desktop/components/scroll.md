# UScroll — 滚动容器

> `import type { ScrollProps, ScrollEmits } from '@veltra/desktop'`

## Import

```ts
import { UScroll } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `tag` | `string` | `'div'` | 容器标签名
| `height` | `string \| number` | `'100%'` | 滚动区域高度
| `always` | `boolean` | `false` | 是否始终显示滚动条
| `contentStyle` | — | — | 内容区域样式
| `containerStyle` | — | — | 容器样式
| `contentClass` | — | — | 内容区域类名
| `containerClass` | — | — | 容器类名
| `dragDebounce` | `number` | — | 拖拽防抖延迟

## Emits

| event | 参数
|-------|------
| `scroll` | `(position)` — 滚动时触发
| `resize` | `(targets: HTMLElement[])` — 容器尺寸变化时触发

## Exposed

| method | 说明
|--------|------
| `scrollTo(position)` | 滚动到指定位置
| `update()` | 手动更新滚动状态
| `contentRef` | 内容区域引用
| `containerRef` | 容器引用
| `el` | 根元素引用

## Examples

```vue
<u-scroll height="300px">
  <p v-for="i in 100" :key="i">第{{ i }}行</p>
</u-scroll>
```
