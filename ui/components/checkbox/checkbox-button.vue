<template>
  <div v-if="!readonly" :class="className" @click="handleInput">
    <slot />
  </div>

  <u-tag
    v-else-if="checked !== undefined"
    :type="checked ? 'success' : 'danger'"
  >
    {{ checked ? '是' : '否' }}
  </u-tag>

  <span v-else>{{ FORM_EMPTY_CONTENT }}</span>
</template>

<script lang="ts" setup>
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import type { CheckboxButtonProps, CheckboxButtonEmits } from '@ui/types'
import { bem } from '@ui/utils'
import { computed } from 'vue'
import { UTag } from '../tag'
import { FORM_EMPTY_CONTENT } from '@ui/shared'

defineOptions({
  name: 'CheckboxButton'
})

const props = withDefaults(defineProps<CheckboxButtonProps>(), {
  disabled: undefined,
  readonly: undefined,
  type: 'primary',
  round: false
})

const emit = defineEmits<CheckboxButtonEmits>()

const slot = defineSlots<{
  default(): any
}>()

const cls = bem('checkbox-button')

const checked = defineModel<boolean>()

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default',
    disabled: false,
    readonly: false
  }
)

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
