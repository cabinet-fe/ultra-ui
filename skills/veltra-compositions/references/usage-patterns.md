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
const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })
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

## useVirtualizer：列表虚拟化的 Vue 薄适配层

`useVirtualizer` 只做 Vue 胶水：构造 `Virtualizer`、订阅快照、按 `count` / `scrollEl` 响应式接入生命周期。业务语义（`virtualEnabled` 阈值、Vue 层 `:key`、`scrollTo` 对齐）由消费者显式组装。

返回值包含四个字段：

- `virtualizer`：底层实例，暴露 `scrollToIndex` / `scrollToOffset` / `setOptions` / `reset` / `measureMany` / `measureElement` 等底层 API。
- `snapshot: ShallowRef<VirtualSnapshot>`：完整快照，仅在需要 `range` / `totalSize` 等字段时使用；**`totalSize` / `beforeSize` / `afterSize` 不应用于模板绑定**，尺寸走 DOM 命令式写入。
- `items: ShallowRef<VirtualItem[]>`：渲染窗口列表，仅在底层 items 引用变化时更新；`v-for` 只读这个即可。
- `isScrolling: ShallowRef<boolean>`：仅在布尔值变化时更新；滚动态联动的视觉逻辑（固定列阴影等）读这个。

**尺寸走 DOM 命令式写入**：传入 `contentEl` / `beforeEl` / `afterEl` 后，hook 会在 subscribe 回调里直接写 `el.style.height`；模板无需绑定 `totalSize` / `beforeSize` / `afterSize`，滚动时 Vue 不会因这些尺寸变化重渲染。

### 多选下拉选项列表（消费者内容容器承接 totalSize）

```typescript
import { useVirtualizer } from '@veltra/compositions'

const virtualEnabled = computed(() => options.value.length > 80)

const { virtualizer, items } = useVirtualizer({
  estimateSize: () => 40,
  count: computed(() => options.value.length),
  scrollEl: () => scrollRef.value?.containerRef ?? null,
  // 仅在虚拟化启用时把内容容器的 height 撑到 totalSize；关闭时传 null，hook 会清除内联 height。
  contentEl: () => (virtualEnabled.value ? (scrollRef.value?.contentRef ?? null) : null)
})

const virtualOptions = computed(() =>
  items.value.map((item) => ({
    option: options.value[item.index]!,
    index: item.index,
    key: item.index,
    offset: item.start
  }))
)

function measureElement(index: number, el: Element | null): void {
  virtualizer.measureElement(index, el)
}
```

### 表格虚拟化：`<tbody>` 占位 + 稳定 key

表格因 `table-layout` 限制无法对整个 `<tbody>` 做 transform，改用两个 `aria-hidden` 的占位 `<tbody>` 承接 `beforeSize` / `afterSize`，由 hook 命令式写入其 `style.height`；`getItemKey` 把测量缓存按行的稳定 uid 存储，前插 / 乱序 / 删除不丢失未变动行的真实测量值：

```typescript
import { useVirtualizer } from '@veltra/compositions'
import { useTemplateRef } from 'vue'

const beforeSpacerRef = useTemplateRef<HTMLElement>('beforeSpacerRef')
const afterSpacerRef = useTemplateRef<HTMLElement>('afterSpacerRef')

const { virtualizer, items, isScrolling } = useVirtualizer({
  count: computed(() => rows.value.length),
  scrollEl: () => scrollRef.value?.containerRef ?? null,
  beforeEl: beforeSpacerRef,
  afterEl: afterSpacerRef,
  estimateSize: () => 41,
  getItemKey: (i) => rows.value[i]?.uid ?? i
})

const virtualEnabled = computed(() => {
  const t = props.virtualThreshold
  return t ? rows.value.length > t : true
})

function scrollTo(index: number): void {
  virtualizer.scrollToIndex(index, { align: 'center' })
}
```

对应的模板片段只需给占位 `<tr>` 加 ref，不用再绑定 `height` 样式：

```vue
<tbody v-if="virtualEnabled" aria-hidden="true">
  <tr ref="beforeSpacerRef"><td :colspan="leafColumns.length" style="padding:0;border:none"/></tr>
</tbody>
<!-- 真实数据行 -->
<tbody v-if="virtualEnabled" aria-hidden="true">
  <tr ref="afterSpacerRef"><td :colspan="leafColumns.length" style="padding:0;border:none"/></tr>
</tbody>
```

### 树形列表（单 content 容器）

树用单一内容容器承接 totalSize，节点直接 `translateY(offset)`：

```typescript
import { useVirtualizer } from '@veltra/compositions'

const virtualEnabled = computed(() => nodes.value.length > 80)

const { virtualizer, items } = useVirtualizer({
  count: computed(() => nodes.value.length),
  estimateSize: () => 40,
  gap: 2,
  scrollEl: () => scrollRef.value?.containerRef ?? null,
  contentEl: () => (virtualEnabled.value ? (scrollRef.value?.contentRef ?? null) : null),
  getItemKey: (i) => nodes.value[i]?.key ?? i
})

// 底层 getItemKey 已保证 DOM 身份稳定，直接以 node.key 作为 Vue 层 :key。
const virtualNodes = computed(() =>
  items.value.map((item) => {
    const node = nodes.value[item.index]!
    return { node, key: node?.key ?? item.index, offset: item.start, index: item.index }
  })
)
```

### 为什么尺寸不走响应式 / 业务语义不封装进 hook

- `totalSize` / `beforeSize` / `afterSize` 会在每次滚动帧变化，用响应式绑定会让容器/占位所在的组件模板整树重渲染；改走 `el.style.height` 命令式写入，滚动帧只摸一两个 DOM 节点，框架零开销。
- `items` 与 `isScrolling` 拆成独立 `shallowRef`：滚动停止/启动只翻 `isScrolling`，不会连带让 `computed(items.map(...))` 重新执行。
- `virtualEnabled` 判定方式各处不同（表格允许 `virtualThreshold` prop 配置，select 还要叠 `!props.grid`），强行内化会反复加参数；
- Vue 层 `:key` 的真正含义是「DOM 身份」，必须由消费者基于业务数据组装，hook 无法代劳；
- `scrollTo` 对齐模式（`start` / `center` / `end` / `auto`）与滚动行为（`auto` / `smooth`）是调用点语义，封装一层会阉割底层能力；
- 需要 `scrollToOffset` / `reset` / `measureMany` 等能力时，消费者直接调 `virtualizer.xxx`，hook 不需要随业务需求持续扩字段。

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

`useTransition('style', …)` 用于需要直接操纵内联样式的过渡；完整选项与工具函数见 `generated/modules/use-transition.md`。
