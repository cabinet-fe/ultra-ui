# API Map

## 模块总览

当前 `@veltra/compositions` 聚合导出这些模块：

- `use-component-props`
- `use-config`
- `use-drag`
- `use-fallback-props`
- `use-focus`
- `use-form-component`
- `use-user-action`
- `use-model`
- `use-pop`
- `use-reactive-size`
- `use-resize-observer`
- `use-transition`
- `use-virtualizer`

## 高频模块摘要

### `useConfig`

源码：`packages/compositions/src/use-config/index.ts`

能力：

- 持有全局 `animation`、`size`、`form.labelWidth`、`paginator.pageSize`
- `setConfig()` 深合并配置
- 自动把 `config.size` 同步为 `document.documentElement` class

### `useModel`

源码：`packages/compositions/src/use-model/index.ts`

能力：

- 支持 `local` 模式
  内部持有可写副本，同时 emit `update:*`
- 支持 `proxy` 模式
  完全受控，不保留本地状态
- 可选 `shallow` 与 `defaultValue`

### `useFormComponent`

源码：`packages/compositions/src/use-form-component/index.ts`

能力：

- 在表单容器中 `provide(formProps)`
- 在子组件中 `inject` 出 `formProps` 与 `inForm`

### `useFormFallbackProps`

源码：`packages/compositions/src/use-fallback-props/index.ts`

能力：

- 从右到左按优先级回退 props
- 缺省顺序：组件 props -> 表单 props -> 全局 config -> 默认值
- 内建表单字段：`size`、`disabled`、`readonly`

### `usePop`

源码：`packages/compositions/src/use-pop/index.ts`

能力：

- 基于 `@floating-ui/dom` 计算浮层位置
- 支持方向、对齐、箭头、滚动父级监听、resize 监听
- 自动维护 `#pop-container`

### `useVirtualizer`

源码：`packages/compositions/src/use-virtualizer/index.ts`

签名：

```ts
useVirtualizer(options: {
  count: Ref<number>
  scrollEl: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** 命令式写入 style.height（水平模式为 width），不经 Vue 响应式 */
  contentEl?: MaybeRefOrGetter<HTMLElement | null | undefined>
  beforeEl?: MaybeRefOrGetter<HTMLElement | null | undefined>
  afterEl?: MaybeRefOrGetter<HTMLElement | null | undefined>
} & Omit<VirtualizerOptions, 'count'>): {
  virtualizer: Virtualizer
  snapshot: ShallowRef<VirtualSnapshot>
  items: ShallowRef<VirtualItem[]>
  isScrolling: ShallowRef<boolean>
}
```

能力：

- 仅做 Vue 胶水层：
  - 以 `options` 构造底层 `Virtualizer`，一次性透传 `buffer` / `gap` / `paddingStart` / `paddingEnd` / `horizontal` / `estimateSize` / `useMeasuredAverage` / `getItemKey` / `initialOffset` / `initialViewport`
  - `subscribe(snapshot)` → 写入 `shallowRef`；同时把 `items` / `isScrolling` 独立拆成两个 `shallowRef`，仅在对应值身份/布尔变化时赋值（避免模板 `v-for` 的 `computed(items.map(...))` 因 `isScrolling` 切换而重新计算）
  - `watch(count)` → `virtualizer.setCount(c)`；`watch(scrollEl, { immediate: true })` → `connect` / `disconnect`
  - `onScopeDispose` 释放订阅并 `destroy` 实例
- **尺寸写入走 DOM（重点）**：传入 `contentEl` / `beforeEl` / `afterEl` 后，hook 在 `subscribe` 回调中直接写 `el.style.height = totalSize|beforeSize|afterSize + 'px'`（`horizontal: true` 时写 `width`）；消费者模板无需绑定 `totalSize` / `beforeSize` / `afterSize`，滚动时 Vue 不会因这些尺寸变化重渲染。元素引用切换或作用域销毁时自动清空内联尺寸。
- 仅 `count` / `scrollEl` / `contentEl` / `beforeEl` / `afterEl` 为响应式输入；其它运行时切换请调用 `virtualizer.setOptions({...})`
- **`initialOffset` / `initialViewport` 仅在构造期生效**，后续 `setOptions` 会忽略这两字段
- Re-export 底层类型：`Virtualizer` / `VirtualSnapshot` / `VirtualItem` / `VirtualRange` / `VirtualizerOptions` / `VirtualScrollOptions` / `VirtualAlign` / `GetItemKey` / `EstimateSize` / `VirtualMeasurement`
- 业务语义（`virtualEnabled` 阈值判定、Vue 层 `v-for :key` 组装、`scrollTo` 对齐模式）由消费者显式组装；hook 不做任何业务决策

底层 `Virtualizer` 常用方法（消费者按需直接调用）：

- `scrollToIndex(index, { align, behavior })` — 对齐方式 `auto` / `start` / `center` / `end`，行为 `auto` / `smooth`
- `scrollToOffset(offset, { behavior })` — 按像素偏移滚动（`align` 对本方法无效）
- `setOptions({...})` — 运行时切换字段（`initialOffset` / `initialViewport` 除外）
- `reset()` — 清空测量缓存并归零 `offset`（数据源整体替换场景）
- `measureMany(iterable)` — 数据层能直接提供尺寸时批量上报
- `measureElement(index, element)` — DOM 尺寸测量；传 `null` 解绑
- 底层启用 `useMeasuredAverage`，未测项估值由已测样本均值接管；`estimateSize` 仅作冷启动兜底
- 可选 `getItemKey(i)`：基于稳定 key 缓存尺寸，数据前插 / 乱序 / 删除时保留未变动项的真实测量值

### `useTransition`

源码：`packages/compositions/src/use-transition/index.ts`

能力：

- `'css'` 模式走类名过渡
- `'style'` 模式走内联 style 过渡

## 主要消费者

`@veltra/desktop` 的表单控件、dropdown/select、table/tree、popup、virtual list 等组件广泛依赖这里。
