<template>
  <div v-if="!readonly" v-bind="$attrs" :class="[cls.b, cls.m(size), bem.is('block', block)]">
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
import { bem, fieldKey, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

import type { CheckboxGroupProps, CheckboxGroupEmits } from '../../types'
import { UCheckbox } from '../checkbox'
import { UTag } from '../tag'

defineOptions({ name: 'UCheckboxGroup', inheritAttrs: false })

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  disabled: undefined,
  readonly: undefined
})

defineEmits<CheckboxGroupEmits>()

const model = defineModel<any[]>()

const cls = bem('checkbox-group')

const labelKey = computed(() => fieldKey(props.labelKey, 'label'))
const valueKey = computed(() => fieldKey(props.valueKey, 'value'))

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
  const value = item[valueKey.value]
  if (!value || !model.value) return false
  return model.value.includes(value)
}

/**
 * 处理更新操作
 * @param  checked - 指示是否选中
 * @param item - 更新的项
 */
const handleUpdate = (checked: boolean, item: Record<string, string | number>) => {
  const value = item[valueKey.value]
  if (!value) return
  if (checked) {
    model.value = [...(model.value ?? []), value]
  } else {
    model.value = model.value?.filter((v) => v !== value)
  }
}

const getLabel = (value: string | number) => {
  const { items } = props
  const item = items.find((item) => item[valueKey.value] === value)
  return item?.[labelKey.value]
}
</script>
