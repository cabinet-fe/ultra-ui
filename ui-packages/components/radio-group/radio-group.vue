<template>
  <div :class="cls.b">
    <u-radio
      v-for="item in items"
      :key="item[valueKey]"
      :value="item[valueKey]"
      @update:model-value="handleUpdate"
      :disabled="disabled"
      :size="size"
      :checked="item[valueKey] === model"
    >
      {{ item[labelKey] }}
    </u-radio>
  </div>
</template>

<script
  lang="ts"
  setup
  generic="
    Item extends Record<string, string | number | boolean>,
    Val extends Item[keyof Item]
  "
>
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

const props = withDefaults(defineProps<RadioGroupProps<Item>>(), {
  labelKey: 'label',
  valueKey: 'value',
  disabled: undefined
})

const { formProps } = useFormComponent()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const model = defineModel<Val>()

const emit = defineEmits<RadioGroupEmits<Item>>()

const cls = bem('radio-group')

const handleUpdate = (value: any) => {
  model.value = value
  // emit('change', )
}
</script>
