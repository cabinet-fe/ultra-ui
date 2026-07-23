# useUserAction 示例

## 阻断 props 回灌

```ts
import { shallowRef, watch } from 'vue'
import { useUserAction } from '@veltra/compositions'

const props = defineProps<{ modelValue?: Date }>()
const emit = defineEmits<{ 'update:modelValue': [value: Date] }>()
const current = shallowRef(props.modelValue)

const { userAction, isUserActive } = useUserAction()

const handleSelect = userAction((d: Date) => {
  current.value = d
  emit('update:modelValue', d)
})

watch(
  () => props.modelValue,
  (v) => {
    if (isUserActive()) return // 用户动作期间跳过回显
    current.value = v
  }
)
```
