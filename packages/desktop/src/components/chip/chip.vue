<template>
  <label :class="classList">
    <input
      type="radio"
      :class="cls.e('native')"
      :name="name"
      :value="value"
      v-model="model"
      :disabled="disabled"
    />

    <span :class="cls.e('face')">
      <span :class="cls.e('label')">
        <slot>{{ label }}</slot>
      </span>
    </span>
  </label>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

import type { ChipEmits, ChipProps } from '../../types'

defineOptions({ name: 'UChip' })

const model = defineModel<any>()

const props = defineProps<ChipProps>()

defineEmits<ChipEmits>()

const cls = bem('chip')

const { formProps } = injectFormContext()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const checked = computed(() => model.value === props.value)

const classList = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('checked', checked.value)
  ]
})
</script>
