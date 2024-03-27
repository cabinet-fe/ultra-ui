<template>
  <label :class="classList">
    <input
      type="radio"
      :class="cls.e('input')"
      :value="value"
      v-model="model"
      @input="emit('update:modelValue', value === model, itemValue!)"
      :disabled="props.disabled"
    />
    <span :class="cls.e('label')">
      <slot name="value">
        {{ value }}
      </slot>
    </span>
  </label>
</template>

<script
  lang="ts"
  setup
  generic="Val extends number | string | boolean = boolean"
>
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import type { RadioProps, RadioEmits } from '@ui/types/components/radio'
import { bem } from '@ui/utils'
import { computed } from 'vue'

defineOptions({
  name: 'Radio'
})

const model = defineModel<Val>()

const emit = defineEmits<RadioEmits>()

const props = withDefaults(defineProps<RadioProps>(), {
  disabled: undefined
})

const cls = bem('radio')

const { formProps } = useFormComponent()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const classList = computed(() => {
  return [cls.b, cls.m(size.value), bem.is('disabled', disabled.value)]
})
</script>
