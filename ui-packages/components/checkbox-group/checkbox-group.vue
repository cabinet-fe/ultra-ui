<template>
  <div :class="cls.b">
    <u-checkbox
      v-for="item of data"
      :key="item[valueKey]"
      :model-value="getCheckStatus(item)"
      @update:model-value="handleUpdate($event, item)"
    >
      {{ item[labelKey] }}
    </u-checkbox>
  </div>
</template>

<script lang="ts" setup generic="Data extends Record<string, string | number>">
import { CheckboxGroupProps, CheckboxGroupEmits } from './checkbox-group.type'
import { UCheckbox } from '../checkbox'
import { bem } from '@ui/utils'
import { useModel } from '@ui/compositions'

defineOptions({
  name: 'UCheckboxGroup'
})

const props = withDefaults(defineProps<CheckboxGroupProps<Data>>(), {
  labelKey: 'label',
  valueKey: 'value'
})

const emit = defineEmits<CheckboxGroupEmits>()

const model = useModel({
  props,
  emit
})

const cls = bem('checkbox-group')

/**
 * 获取checkbox的选中状态
 * @param item - 模型对象
 * @returns 模型值是否存在于model.value中
 */
const getCheckStatus = (item: Record<string, string | number>): boolean => {
  const { valueKey } = props
  const value = item[valueKey]
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
  const value = item[valueKey]
  if (!value) return
  if (checked) {
    model.value = [...(model.value ?? []), value]
  } else {
    model.value = model.value?.filter(v => v !== value)
  }
}
</script>
