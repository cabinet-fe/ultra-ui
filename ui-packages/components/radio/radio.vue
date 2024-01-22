<template>
  <label @click="handleChange" :class="classList">
    <span :class="cls.e('input')">
      <span :class="cls.e('inner')"></span>
    </span>
    <span :class="cls.e('label')">
      <slot />
    </span>
  </label>
</template>

<script lang="ts" setup generic="Val extends boolean = boolean">
import type {RadioProps, RadioEmits} from "@ui/types/components/radio"
import {bem} from "@ui/utils"
import {shallowRef, watch, computed} from "vue"

defineOptions({
  name: "Radio",
})

const model = defineModel<Val>()

const emit = defineEmits<RadioEmits>()

const props = withDefaults(defineProps<RadioProps>(), {
  disabled:false
})

const cls = bem("radio")

let checked = shallowRef<boolean | undefined>(
  typeof model.value == "boolean" ? model.value : false
)

const classList = computed(() => {
  return [
    cls.b,
    bem.is("checked",checked.value),
    bem.is("disabled",props.disabled)
  ]
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
