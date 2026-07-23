# useVirtualizer - 虚拟滚动

## 示例

见 `./examples.md`

## 类型

```ts
import type {
  Virtualizer,
  VirtualItem,
  VirtualSnapshot,
  VirtualizerOptions
} from '@cat-kit/fe'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'

type MaybeEl = HTMLElement | null | undefined

interface UseVirtualizerOptions extends Omit<VirtualizerOptions, 'count'> {
  count: Ref<number>
  scrollEl: MaybeRefOrGetter<MaybeEl>
  /** 写入 style.height|width = totalSize，不经 Vue 响应式 */
  contentEl?: MaybeRefOrGetter<MaybeEl>
  /** 写入 beforeSize */
  beforeEl?: MaybeRefOrGetter<MaybeEl>
  /** 写入 afterSize */
  afterEl?: MaybeRefOrGetter<MaybeEl>
}

interface UseVirtualizerReturned {
  virtualizer: Virtualizer
  snapshot: ShallowRef<VirtualSnapshot>
  items: ShallowRef<VirtualItem[]>
  isScrolling: ShallowRef<boolean>
}

function useVirtualizer(options: UseVirtualizerOptions): UseVirtualizerReturned
```

## 说明

- `@cat-kit/fe` `Virtualizer` 的 Vue 适配层。
- `totalSize` / `beforeSize` / `afterSize` 命令式写 DOM `style`，滚动期避免因尺寸变化触发 Vue 重渲染。
- `items` 与 `isScrolling` 拆成独立 shallowRef，避免 `isScrolling` 切换连带触发 `v-for` 重算。
- 约束：`initialOffset` / `initialViewport` 仅构造时生效；运行时改 `estimateSize` 等请调用 `virtualizer.setOptions(...)`。
