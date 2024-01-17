<template>
  <button
    @click="handleChange"
    :class="[cls.b, isChecked ? 'isChecked' : '',disabled||disabledAll?'isDisabled':'']"
    :style="isChecked ? {backgroundColor: checkedColor,color: checkedColor?'#fff':''} : {}"
  >
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
import {shallowRef, watch} from "vue"

defineOptions({
  name: "RadioButton",
})

const model = defineModel<Val>()

const emit = defineEmits<RadioButtonEmits>()

const props = withDefaults(defineProps<RadioButtonProps>(), {})

const cls = bem("radio-button")

let isChecked = shallowRef<boolean | number | undefined>(
  typeof model.value == "boolean" ? model.value : false
)

const handleChange = () => {
  if(props.disabledAll) return
  if(props.disabled) return
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
