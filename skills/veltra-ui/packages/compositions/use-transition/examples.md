# useTransition 示例

## CSS 类过渡

```ts
import { shallowRef } from 'vue'
import { useTransition } from '@veltra/compositions'

const target = shallowRef<HTMLElement>()

const { toggle, enter, leave } = useTransition('css', {
  target,
  name: 'fade',
  keepEnterTo: false,
  afterEnter: () => {},
  afterLeave: () => {}
})

enter()
leave()
toggle(true)
```

## 内联 style 过渡

```ts
import { shallowRef } from 'vue'
import { useTransition } from '@veltra/compositions'

const target = shallowRef<HTMLElement>()

const { toggle } = useTransition('style', {
  target,
  enterTo: { opacity: '1' },
  enterActive: { transition: 'opacity .3s' },
  leaveActive: { transition: 'opacity .3s' }
})

toggle((active) => !active)
```
