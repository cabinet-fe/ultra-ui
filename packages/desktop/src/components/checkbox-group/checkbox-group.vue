<template>
  <div :class="[cls.b, cls.m(size), bem.is('block', block)]" v-if="!readonly">
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

  <div v-else-if="model?.length" :class="[cls.m(size), cls.e('readonly-tags')]">
    <div :class="cls.e('tags')">
      <u-tag v-for="tag of model" :key="tag">
        {{ getLabel(tag) }}
      </u-tag>
    </div>
  </div>

  <template v-else>
    {{ FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, FORM_EMPTY_CONTENT } from '@veltra/utils'

import type { CheckboxGroupProps, CheckboxGroupEmits } from '../../types'
import { injectFormContext } from '../../utils/form-context'
import { UCheckbox } from '../checkbox'
import { UTag } from '../tag'

defineOptions({
  name: 'CheckboxGroup'
})

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  disabled: undefined,
  readonly: undefined
})

defineEmits<CheckboxGroupEmits>()

const model = defineModel<any[]>()

const cls = bem('checkbox-group')

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

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
const handleUpdate = (checked: boolean, item: Record<string, string | number>) => {
  const { valueKey } = props
  const value = item[valueKey]
  if (!value) return
  if (checked) {
    model.value = [...(model.value ?? []), value]
  } else {
    model.value = model.value?.filter((v) => v !== value)
  }
}

const getLabel = (value: string | number) => {
  const { items, valueKey, labelKey } = props
  const item = items.find((item) => item[valueKey] === value)
  return item?.[labelKey]
}
</script>
