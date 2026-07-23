# useFallbackProps 示例

## 组件 props 回退

```ts
import { useFallbackProps } from '@veltra/compositions'
import type { ComponentSize } from '@veltra/utils'

const props = defineProps<{ size?: ComponentSize; disabled?: boolean }>()

const { size, disabled } = useFallbackProps([props], {
  size: 'default' as ComponentSize,
  disabled: false
})
// size / disabled 为 ComputedRef
```

## 表单上下文链

```ts
import { useFormFallbackProps } from '@veltra/compositions'
import { injectFormContext } from '@veltra/utils'

const props = defineProps<{
  size?: 'small' | 'default' | 'large'
  disabled?: boolean
  readonly?: boolean
}>()

const { formProps } = injectFormContext()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])
```

## 只覆盖部分表单默认值

```ts
import { useFormFallbackProps } from '@veltra/compositions'

const { size, disabled } = useFormFallbackProps([props], {
  size: 'small',
  disabled: true
})
```
