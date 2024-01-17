<template>
  <div
    @click="handleChange"
    :class="[cls.b, isChecked ? 'isChecked' : '', disabled || disabledAll ? 'isDisabled' : '']"
  >
    <span :class="cls.e('input')">
      <input type="radio" />
      <span :class="cls.m('inner')"></span>
    </span>
    <span :class="cls.e('label')">
      <slot />
    </span>
  </div>
</template>

<script lang="ts" setup generic="Val extends number | boolean = boolean">
import type {RadioProps, RadioEmits} from "@ui/types/components/radio"
import {bem} from "@ui/utils"
import {shallowRef, watch} from "vue"

defineOptions({
  name: "Radio",
})

const model = defineModel<Val>()

const emit = defineEmits<RadioEmits>()

const props = withDefaults(defineProps<RadioProps>(), {})

const cls = bem("radio")

let isChecked = shallowRef<boolean | number | undefined>(
  typeof model.value == "boolean" ? model.value : false
)

const handleChange = () => {
  if(props.disabledAll) return
  if (props.disabled) return
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
