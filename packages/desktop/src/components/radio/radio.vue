<template>
  <label :class="classList">
    <!-- radio框 -->
    <section :class="cls.e('button')">
      <input
        type="radio"
        :class="cls.e('native')"
        :value="value"
        v-model="model"
        :disabled="disabled"
        hidden
      />

      <transition name="zoom-in">
        <span :class="cls.e('inner')" v-if="radioChecked"></span>
      </transition>
    </section>

    <span :class="cls.e('label')">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { RadioProps, RadioEmits } from '../../types'
import { injectFormContext } from '../../utils/form-context'

defineOptions({
  name: 'Radio'
})

const model = defineModel<any>()

const props = withDefaults(defineProps<RadioProps>(), {
  disabled: undefined
})

defineEmits<RadioEmits>()

const cls = bem('radio')

const { formProps } = injectFormContext()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const radioChecked = computed(() => model.value === props.value)

const classList = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('checked', radioChecked.value)
  ]
})
</script>
