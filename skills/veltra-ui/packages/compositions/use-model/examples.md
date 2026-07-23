# useModel 示例

## 本地副本（默认）

```ts
import { useModel } from '@veltra/compositions'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const model = useModel({ props, emit })
model.value = 'hello' // emit + 本地更新
```

## 纯代理（完全受控）

```ts
import { useModel } from '@veltra/compositions'

const model = useModel({ props, emit, local: false })
// set 仅 emit，视图依赖外部回传 props
```

## 受控自动切换

```ts
import { useModel } from '@veltra/compositions'

const model = useModel({
  props,
  emit,
  local: () => props.modelValue === undefined
})
```

## 自定义 prop 名

```ts
import { useModel } from '@veltra/compositions'

const props = defineProps<{ visible?: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const visible = useModel({ props, emit, propName: 'visible' })
```
