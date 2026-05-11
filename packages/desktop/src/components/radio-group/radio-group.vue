<template>
  <div :class="[cls.b, bem.is('block', block), cls.m(size)]" v-if="!readonly">
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

  <template v-else>
    {{ items.find((item) => item[valueKey] === model)?.[labelKey] || FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'

import type { RadioGroupProps, RadioGroupEmits } from '../../types'
import URadio from '../radio/radio.vue'

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

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const cls = bem('radio-group')

const handleUpdate = (value: any, item: Record<string, any>) => {
  model.value = value
  emit('change', item)
}
</script>
