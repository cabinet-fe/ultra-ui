# @veltra/compositions — 集成模式

下文片段均来自本仓库 `packages/desktop`，便于对照真实用法。

## useModel：local / proxy / 动态 local

### 下拉可见性（默认 local）

`dropdown` 用 `visible` prop + `update:visible` 与内部 ref 同步，属于典型的 local 模式（`local` 默认为 `true`）：

```typescript
// packages/desktop/src/components/dropdown/dropdown.vue
const visible = useModel({ defaultValue: false, propName: 'visible', props, emit })
```

### 表格当前行（随 `highlightCurrent` 在 local 与「纯受控」间切换）

`local` 传入函数时，在开启/关闭行高亮时在「可写本地副本」与「完全由 props 驱动」之间切换：

```typescript
// packages/desktop/src/components/table/use-rows.ts
const currentRow = useModel({
  props,
  emit,
  propName: 'current',
  shallow: true,
  local: () => !!props.highlightCurrent
})
```

### 表单类组件与 `defineModel`

多数表单控件（如 `input`）在 Vue 3.5+ 下直接使用 `defineModel`，不再手写 `useModel`；需要自定义 prop 名（如 `visible`）或细粒度控制 `local` / `shallow` 时仍用 `useModel`。

## useFallbackProps / useFormFallbackProps：三级回退

回退顺序：**组件 props → 表单 `provide` 上下文 → `useConfig` 全局配置 → 调用处默认值**。

### 表单子组件：`useFormFallbackProps`

```typescript
// packages/desktop/src/components/input/input.vue
const { formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  /* 各字段最终回退默认值 */
})
```

### 表单根：`useFormComponent` 提供上下文

```typescript
// packages/desktop/src/components/form/form.vue
useFormComponent(props)
```

### 独立组件：仅 `useFallbackProps`

```typescript
// packages/desktop/src/components/button/button.vue
const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})
```

## usePop：浮层与 `floating-ui`

下拉内容与触发器联动，并在定位更新后驱动过渡进入：

```typescript
// packages/desktop/src/components/dropdown/dropdown.vue
const { update, popperContainerId } = usePop({
  triggerRef: triggerDom,
  contentRef,
  direction: 'bottom',
  alignment: 'start',
  onPop(position) {
    transitionName.value = position.placement.includes('top') ? 'slide-up' : 'slide-down'
    transition.enter()
  },
  onTriggerPositionChange() {
    close()
  },
  onBeforeUpdate(triggerEl, contentEl) {
    setStyles(contentEl, {
      width: props.width ?? `${triggerEl.offsetWidth}px`,
      minWidth: props.minWidth
    })
  }
})
```

## useVirtual：列表虚拟化

与 `@tanstack/vue-virtual` 配合：传入 `scrollEl`、`count`、`estimateSize` 等，模板里用 `measureElement` 绑定行根节点。

### 多选下拉选项列表

```typescript
// packages/desktop/src/components/multi-select/multi-select.vue
const { totalHeight, virtualList, virtualEnabled, measureElement } = useVirtual({
  virtualThreshold: 80,
  estimateSize: () => 40,
  count: computed(() => options.value.length),
  scrollEl: computed(() => scrollRef.value?.containerRef ?? null)
})
```

`table` 等大表体同样使用 `useVirtual`；可按 `useVirtual(` 在 `packages/desktop` 内搜索其它变体。

### 树形列表（`tree`）

展平节点后对大列表做虚拟化，带 `gap` 与 `scrollTo` 等选项：

```typescript
// packages/desktop/src/components/tree/tree.vue
const { totalHeight, virtualList, scrollTo, virtualEnabled, measureElement } = useVirtual({
  count: computed(() => nodes.value.length),
  estimateSize: () => 40,
  gap: 2,
  virtualThreshold: 80,
  scrollEl: computed(() => scrollRef.value?.containerRef ?? null)
})
```

## useTransition：`css` 与 `style` 模式

### `css` 模式：下拉内容显隐

```typescript
// packages/desktop/src/components/dropdown/dropdown.vue
const transition = useTransition('css', {
  name: transitionName,
  target: contentRef,
  afterLeave() {
    visible.value = false
  },
  leaveCanceled() {
    visible.value = false
  }
})
```

### `css` 模式：对话框最大化尺寸动画

```typescript
// packages/desktop/src/components/dialog/use-maximum.ts
const maximizeTransition = useTransition('css', {
  target: dialogRef,
  name: 'dialog-maximize',
  keepEnterTo: true,
  afterLeave() {
    dialogRef.value && removeStyles(dialogRef.value, ['height'])
  }
})
```

`useTransition('style', …)` 用于需要直接操纵内联样式的过渡；完整选项与工具函数见 `generated/api-reference.md` 中 `use-transition` 章节。
