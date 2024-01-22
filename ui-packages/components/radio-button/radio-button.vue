<template>
  <button @click="handleChange" :class="classList" :style="styleObj">
    <span :class="cls.e('input')" v-if="!checkedColor">
      <span :class="cls.m('inner')"></span>
    </span>
    <span :class="cls.e('label')">
      <slot />
    </span>
  </button>
</template>

<script lang="ts" setup generic="Val extends number | boolean = boolean">
import type {
  RadioButtonProps,
  RadioButtonEmits,
} from "@ui/types/components/radio-button"
import {bem} from "@ui/utils"
import {shallowRef, watch, computed} from "vue"

defineOptions({
  name: "RadioButton",
})

const model = defineModel<Val>()

const emit = defineEmits<RadioButtonEmits>()

const props = withDefaults(defineProps<RadioButtonProps>(), {
  size: "default",
})

const cls = bem("radio-button")

let isChecked = shallowRef<boolean | number | undefined>(
  typeof model.value == "boolean" ? model.value : false
)

const classList = computed(() => {
  return [
    cls.b,
    cls.m(props.size),
    props.disabledIndex || props.disabled ? "isDisabled" : "",
    isChecked.value ? "isChecked" : "",
  ]
})

const styleObj = computed(() => {
  return isChecked.value
    ? {
        backgroundColor: props.checkedColor,
        color: props.checkedColor ? "#fff" : "",
      }
    : {}
})

const handleChange = () => {
  if (props.disabled) return
  if (props.disabledIndex) return
  isChecked.value = true
  emit("update:modelValue", isChecked.value)

  emit("update:modelDataValue", isChecked.value, props.itemValue!)
}
watch(
  () => model.value,
  (val) => {
    isChecked.value = val
  }
)
</script>
