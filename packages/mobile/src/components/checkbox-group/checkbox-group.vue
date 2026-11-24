<template>
  <div v-if="!readonly" v-bind="$attrs" :class="[cls.b, cls.m(size), bem.is('divider', divider)]">
    <UCheckbox
      v-for="item of items"
      :key="item[valueKey]"
      :model-value="getCheckStatus(item)"
      @update:model-value="handleUpdate($event, item)"
      :disabled="disabled"
      :size="size"
    >
      {{ item[labelKey] }}
    </UCheckbox>
  </div>

  <div v-else-if="model?.length" :class="[cls.m(size), cls.e('readonly-tags')]">
    <div :class="cls.e('tags')">
      <UTag v-for="tag of model" :key="tag">
        {{ getLabel(tag) }}
      </UTag>
    </div>
  </div>

  <template v-else>
    {{ FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import './style'
import { useFormFallbackProps } from '@veltra/compositions'
import { fieldKey, FORM_EMPTY_CONTENT, injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

import { bem } from '../../shared/bem'
import type { CheckboxGroupEmits, CheckboxGroupProps } from '../../types/checkbox-group'
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

const getCheckStatus = (item: Record<string, string | number>): boolean => {
  const value = item[valueKey.value]
  if (!value || !model.value) return false
  return model.value.includes(value)
}

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
