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
        :checked="radioChecked"
        hidden
      />

      <transition name="radio">
        <span :class="cls.e('inner')" v-if="radioChecked"></span>
      </transition>
    </section>

    <span :class="cls.e('label')">
      <slot>
        {{ label }}
      </slot>
    </span>
  </label>
</template>

<script lang="ts" setup generic="Val extends number | string | boolean">
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import type { RadioProps, RadioEmits } from '@ui/types/components/radio'
import { bem } from '@ui/utils'
import { computed } from 'vue'

defineOptions({
  name: 'Radio'
})

const model = defineModel<Val>()

const emit = defineEmits<RadioEmits>()

const props = withDefaults(defineProps<RadioProps<Val>>(), {
  disabled: undefined,
  checked: undefined
})

const cls = bem('radio')

const { formProps } = useFormComponent()

const { size, disabled } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false
})

const radioChecked = computed(() => {
  return props.checked ?? model.value === props.value
})

const classList = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('checked', radioChecked.value)
  ]
})
</script>
