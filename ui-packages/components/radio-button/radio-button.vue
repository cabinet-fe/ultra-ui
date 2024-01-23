<template>
  <button
    @click="handleChange(value === model, itemValue!)"
    :class="classList"
    :style="styleObj"
  >
    <label :class="cls.m('label')">
      <input
        v-if="!checkedColor"
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
  </button>
</template>

<script
  lang="ts"
  setup
  generic="Val extends number | string | boolean = boolean"
>
import type {
  RadioButtonProps,
  RadioButtonEmits,
} from "@ui/types/components/radio-button"
import {bem} from "@ui/utils"
import {computed} from "vue"

defineOptions({
  name: "RadioButton",
})

const model = defineModel<Val>()

const emit = defineEmits<RadioButtonEmits>()

const props = withDefaults(defineProps<RadioButtonProps>(), {
  size: "default",
  disabled: false,
})

const cls = bem("radio-button")

const classList = computed(() => {
  return [
    cls.b,
    cls.m(props.size),
    bem.is("disabled", props.disabled),
    bem.is("checked", model.value === props.value),
  ]
})

const styleObj = computed(() => {
  return model.value === props.value
    ? {
        backgroundColor: props.checkedColor,
        color: props.checkedColor ? "#fff" : "",
      }
    : {}
})

const handleChange = (
  value: number | string | boolean,
  item: Record<string, any>
) => {
  if (!props.checkedColor) return
  if (props.disabled) return
  emit("update:modelValue", !value, item!)
}
</script>
