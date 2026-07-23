# useResizeObserver 示例

## 监听单个元素

```ts
import { shallowRef } from 'vue'
import { useResizeObserver } from '@veltra/compositions'

const elRef = shallowRef<HTMLElement>()

const { disconnect } = useResizeObserver({
  targets: elRef,
  onResize: (entries) => {
    const entry = entries[0]
    console.log(entry?.contentRect)
  }
})
```

## 按元素注册回调

```ts
import { useObserverCallback } from '@veltra/compositions'

const { observeEl, unobserveEl } = useObserverCallback()

function bind(el: HTMLElement) {
  observeEl(el, (entry) => {
    console.log(entry.borderBoxSize)
  })
}

function unbind(el: HTMLElement) {
  unobserveEl(el)
}
```
