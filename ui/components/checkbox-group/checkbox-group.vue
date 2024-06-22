<template>
  <div :class="[cls.b, bem.is('block', block)]">
    <u-checkbox
      v-for="item of items"
      :key="item[valueKey]"
      :model-value="getCheckStatus(item)"
      @update:model-value="handleUpdate($event, item)"
      :disabled="disabled"
      :size="size"
    >
      {{ item[labelKey] }}
    </u-checkbox>
  </div>
</template>

<script
  lang="ts"
  setup
  generic="
    Item extends Record<string, string | number>,
    Val extends string | number
  "
>
import type {
  CheckboxGroupProps,
  CheckboxGroupEmits
} from '@ui/types/components/checkbox-group'
import { UCheckbox } from '../checkbox'
import { bem } from '@ui/utils'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'CheckboxGroup'
})

const props = withDefaults(defineProps<CheckboxGroupProps<Item, Val>>(), {
  labelKey: 'label',
  valueKey: 'value',
  disabled: undefined
})

const emit = defineEmits<CheckboxGroupEmits<Val>>()
const model = defineModel<Val[]>()

const cls = bem('checkbox-group')

const { formProps } = useFormComponent()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

/**
 * 获取checkbox的选中状态
 * @param item - 模型对象
 * @returns 模型值是否存在于model.value中
 */
const getCheckStatus = (item: Record<string, string | number>): boolean => {
  const { valueKey } = props
  const value = item[valueKey] as Val
  if (!value || !model.value) return false
  return model.value.includes(value)
}

/**
 * 处理更新操作
 * @param  checked - 指示是否选中
 * @param item - 更新的项
 */
const handleUpdate = (
  checked: boolean,
  item: Record<string, string | number>
) => {
  const { valueKey } = props
  const value = item[valueKey] as Val
  if (!value) return
  if (checked) {
    model.value = [...(model.value ?? []), value]
  } else {
    model.value = model.value?.filter(v => v !== value)
  }
}
</script>
