# useDrag 示例

## 带范围的拖拽

```ts
import { shallowRef } from 'vue'
import { useDrag } from '@veltra/compositions'

const target = shallowRef<HTMLElement>()

const { update } = useDrag({
  target,
  rangeX: [0, 500],
  rangeY: [0, 300],
  initial: { offsetX: 0, offsetY: 0 },
  onDragStart: (e) => {},
  onDrag: ({ x, y, offsetX, offsetY, e }) => {
    target.value!.style.transform = `translate(${offsetX}px, ${offsetY}px)`
  },
  onDragEnd: ({ offsetX, offsetY }) => {}
})

// 外部重置偏移
update({ offsetX: 0, offsetY: 0 })
```
