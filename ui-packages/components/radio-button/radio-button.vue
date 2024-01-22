<template>
  <button @click="handleChange" :class="classList" :style="styleObj">
    <span :class="cls.e('input')" v-if="!checkedColor">
      <span :class="cls.e('inner')"></span>
    </span>
    <span :class="cls.e('label')">
      <slot />
    </span>
  </button>
</template>

<script lang="ts" setup generic="Val extends boolean = boolean">
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
  disabled:false
})

const cls = bem("radio-button")

let checked = shallowRef<boolean | undefined>(
  typeof model.value == "boolean" ? model.value : false
)

const classList = computed(() => {
  return [
    cls.b,
    cls.m(props.size),
    bem.is("disabled", props.disabled),
    bem.is("checked", checked.value),
  ]
})

const styleObj = computed(() => {
  return checked.value
    ? {
        backgroundColor: props.checkedColor,
        color: props.checkedColor ? "#fff" : "",
      }
    : {}
})

const handleChange = () => {
  if (props.disabled) return
  checked.value = true
  emit("update:modelValue", checked.value)

  emit("update:modelDataValue", checked.value, props.itemValue!)
}
watch(
  () => model.value,
  (val) => {
    checked.value = val
  }
)
</script>
