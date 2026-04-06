# fe — 虚拟滚动

## Virtualizer

```typescript
import { Virtualizer } from '@cat-kit/fe'

const v = new Virtualizer({
  length: 10000,
  estimateSize: (index) => 50,
  buffer: 5,
  onChange: ({ items, totalSize }) => renderItems(items)
})

v.update({ length, containerSize, offsetSize, buffer })
v.updateItemSize(index, measuredHeight)
v.getVisibleItems()  // { index, start, size }[]
v.getTotalSize()
v.reset()
```

## VirtualContainer

```typescript
import { VirtualContainer } from '@cat-kit/fe'

const c = new VirtualContainer({ vertical?: Virtualizer, horizontal?: Virtualizer })
c.connect('#list')       // 或 HTMLElement
c.scrollTo(1000)
c.scrollToIndex(100)
c.disconnect()
```
