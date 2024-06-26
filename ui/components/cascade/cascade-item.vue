<template>
  <li
    v-for="(option, index) of options"
    :class="[cls.e('option'), bem.is('selected', option[valueKey] === model)]"
    @click="handleSelect(option[valueKey])"
    :data-key="option[valueKey]"
    :key="option[valueKey]"
  >
    <slot v-bind="{ option, index }">
      {{ option[labelKey] }}
    </slot>
  </li>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import type { CascadeProps, CascadeEmits } from "@ui/types/components/cascade"
import { bem } from "@ui/utils"
import { shallowRef } from "vue"

defineOptions({
  name: "CascadeItem",
})

const cls = bem("cascade")

const emit = defineEmits<CascadeEmits<Option>>()

withDefaults(defineProps<CascadeProps>(), {
  labelKey: "label",
  valueKey: "value",
})
const model = defineModel<string | number>()
console.log(model.value, "============")

const selected = shallowRef<Record<string, any>>()
/** 单选 */
const handleSelect = (option: []) => {
  selected.value = option
  // dropdownRef.value?.close()
  emit("change", option)
}
</script>
