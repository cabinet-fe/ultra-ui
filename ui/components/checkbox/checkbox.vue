<template>
  <label :class="className" v-if="!readonly">
    <span :class="cls.e('wrap')">
      <transition name="zoom-in" mode="out-in">
        <svg viewBox="0 0 64 64" v-if="checked" fill="currentColor">
          <path
            d="M50.42,16.76L22.34,39.45l-8.1-11.46c-1.12-1.58-3.3-1.96-4.88-0.84c-1.58,1.12-1.95,3.3-0.84,4.88l10.26,14.51  c0.56,0.79,1.42,1.31,2.38,1.45c0.16,0.02,0.32,0.03,0.48,0.03c0.8,0,1.57-0.27,2.2-0.78l30.99-25.03c1.5-1.21,1.74-3.42,0.52-4.92  C54.13,15.78,51.93,15.55,50.42,16.76z"
          ></path>
        </svg>
        <span v-else-if="indeterminate" :class="cls.m('indeterminate')"></span>
      </transition>
    </span>

    <input
      type="checkbox"
      :checked="checked"
      :disabled="disabled"
      hidden
      @input="handleInput"
    />

    <span :class="cls.e('label')"><slot /> </span>
  </label>

  <span v-else> {{ trueVal === model ? '是' : '否' }}</span>
</template>

<script
  lang="ts"
  setup
  generic="Val extends string | number | boolean = boolean"
>
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import type {
  CheckboxProps,
  CheckboxEmits
} from '@ui/types/components/checkbox'
import { bem } from '@ui/utils'
import { computed } from 'vue'

defineOptions({
  name: 'Checkbox'
})
const props = withDefaults(defineProps<CheckboxProps<Val>>(), {
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<CheckboxEmits<Val>>()
const cls = bem('checkbox')

const model = defineModel<Val>()

const trueVal = computed(() => {
  return props.trueValue ?? (true as Val)
})

const falseVal = computed(() => {
  return props.falseValue ?? (false as Val)
})

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
    bem.is('disabled', disabled.value),
    bem.is('checked', checked.value || props.indeterminate)
  ]
})

const checked = computed(() => {
  return trueVal.value === model.value
})

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  model.value = target.checked ? trueVal.value : falseVal.value
}
</script>
