<template>
  <div :class="[cls.b, bem.is('block', block)]" v-if="!readonly">
    <u-radio
      v-for="item of items"
      :key="item[valueKey]"
      :value="item[valueKey]"
      :model-value="model"
      @update:model-value="handleUpdate($event, item)"
      :disabled="disabledItem?.(item) || disabled"
      :size="size"
    >
      {{ item[labelKey] }}
    </u-radio>
  </div>

  <span v-else :class="formItemViewerCls">
    {{
      items.find(item => item[valueKey] === model)?.[labelKey] ||
      FORM_EMPTY_CONTENT
    }}
  </span>
</template>

<script lang="ts" setup>
import type { RadioGroupProps, RadioGroupEmits } from '@ui/types'
import { bem } from '@ui/utils'
import URadio from '../radio/radio.vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { FORM_EMPTY_CONTENT } from '@ui/shared'
import { formItemViewerCls } from '../form-item/helper'

defineOptions({
  name: 'RadioGroup'
})

const props = withDefaults(defineProps<RadioGroupProps>(), {
  labelKey: 'label',
  valueKey: 'value',
  disabled: undefined,
  readonly: undefined
})

const model = defineModel<any>()

const emit = defineEmits<RadioGroupEmits>()

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default',
    disabled: false,
    readonly: false
  }
)

const cls = bem('radio-group')

const handleUpdate = (value: any, item: Record<string, any>) => {
  model.value = value
  emit('change', item)
}
</script>
