<template>
  <div :class="cls.b" v-if="!readonly">
    <u-radio
      v-for="item of items"
      :key="item[valueKey]"
      :value="item[valueKey]"
      @update:model-value="handleUpdate($event as Val, item)"
      :disabled="disabledItem?.(item) ||  disabled"
      :size="size"
      :checked="item[valueKey] === model"
    >
      {{ item[labelKey] }}
    </u-radio>
  </div>

  <span v-else>
    {{ items.find(item => item[valueKey] === model)?.[labelKey] }}
  </span>
</template>

<script lang="ts" setup generic="Val extends number | string | boolean">
import type {
  RadioGroupProps,
  RadioGroupEmits
} from '@ui/types/components/radio-group'
import { bem } from '@ui/utils'
import URadio from '../radio/radio.vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'RadioGroup'
})

const props = withDefaults(defineProps<RadioGroupProps<Val>>(), {
  labelKey: 'label',
  valueKey: 'value',
  disabled: undefined,
  readonly: undefined
})

const model = defineModel<Val>()

const emit = defineEmits<RadioGroupEmits<Val>>()

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const cls = bem('radio-group')

const handleUpdate = (
  value: Val,
  item: Record<string, string | number | boolean>
) => {
  model.value = value
  emit('change', item)
}
</script>
