<template>
  <button :class="classList" :style="styleObj">
    <label :class="cls.m('label')">
      <input
        :hidden="exist"
        type="radio"
        :class="cls.e('input')"
        :value="checked"
        v-model="model"
        @input.stop="emit('update:modelValue', value === model, itemValue!)"
        :disabled="props.disabled"
        ref="input"
      />
      <span>
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
import {computed, ref} from "vue"

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

const input = ref<HTMLInputElement>()

let checked = ref(props.value)

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

const exist = computed(() => {
  return props.checkedColor ? true : false
})
</script>
