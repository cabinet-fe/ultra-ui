<template>
  <div v-if="!readonly" :class="className" @click="handleInput">
    <slot />
  </div>

  <u-tag v-else-if="checked !== undefined" :type="checked ? 'success' : 'danger'">
    {{ checked ? '是' : '否' }}
  </u-tag>

  <template v-else>
    {{ FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

import type { CheckboxButtonProps, CheckboxButtonEmits } from '../../types'
import { UTag } from '../tag'

defineOptions({ name: 'CheckboxButton' })

const props = withDefaults(defineProps<CheckboxButtonProps>(), {
  disabled: undefined,
  readonly: undefined,
  type: 'primary',
  round: false
})

const emit = defineEmits<CheckboxButtonEmits>()

const slot = defineSlots<{ default(): any }>()

const cls = bem('checkbox-button')

const checked = defineModel<boolean>()

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const className = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is(props.type),
    bem.is('round', props.round),
    bem.is('disabled', disabled.value),
    bem.is('checked', checked.value)
  ]
})

const handleInput = () => {
  checked.value = !checked.value
  emit('change', !!checked.value)
}
</script>
