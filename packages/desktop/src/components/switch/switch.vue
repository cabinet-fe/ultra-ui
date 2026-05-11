<template>
  <label :class="switchClass" @click.stop>
    <input
      type="checkbox"
      :class="cls.e('native')"
      hidden
      :checked="model"
      :disabled="disabled"
      @input="handleInput"
    />
    <span :class="[cls.e('text'), bem.is('selected', !model)]" v-if="inactiveText">
      {{ inactiveText }}
    </span>

    <div :class="cls.e('button')">
      <span :class="cls.e('thumb')"></span>
    </div>

    <span v-if="activeText" :class="[cls.e('text'), bem.is('selected', model)]">
      {{ activeText }}
    </span>
  </label>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

import type { SwitchEmits, SwitchProps, _SwitchExposed } from '../../types'

defineOptions({
  name: 'Switch'
})

const props = withDefaults(defineProps<SwitchProps>(), {
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<SwitchEmits>()

const model = defineModel<boolean>()

const cls = bem('switch')

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const switchClass = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('readonly', readonly.value),
    bem.is('checked', model.value)
  ]
})

const handleInput = (e: Event) => {
  if (disabled.value || readonly.value) return

  const newValue = (e.target as HTMLInputElement).checked
  model.value = newValue
  emit('change', newValue)
}
</script>
