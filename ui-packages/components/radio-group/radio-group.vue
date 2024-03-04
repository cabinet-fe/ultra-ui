<template>
  <div :class="[cls.b, radioType == 'btn' ? cls.m('button') : '']">
    <template v-if="radioType == 'radio'">
      <u-radio
        v-for="(item, index) in data"
        :key="index"
        v-model="radioModels[index]"
        :value="item[labelKey]"
        :itemValue="item"
        @update:model-value="handleUpdate($event, item, index)"
        :disabled="disabled || compareDisabled(index)"
        :size="size"
      />
    </template>

    <template v-else>
      <u-radio-button
        :class="cls.e('button-item')"
        v-for="(itemBtn, indexBtn) in data"
        :key="indexBtn"
        v-model="radioModels[indexBtn]"
        :value="itemBtn[labelKey]"
        :itemValue="itemBtn"
        @update:modelValue="handleUpdate($event, itemBtn, indexBtn)"
        :checked-color="checkedColor"
        :disabled="disabled || compareDisabled(indexBtn)"
        :size="size"
      />
    </template>
  </div>
</template>

<script
  lang="ts"
  setup
  generic="Val extends number | string | boolean = boolean"
>
import type {
  RadioGroupProps,
  RadioGroupEmits,
} from "@ui/types/components/radio-group"
import {bem} from "@ui/utils"
import URadio from "../radio/radio.vue"
import URadioButton from "../radio-button/radio-button.vue"
import {onMounted, ref} from "vue"

defineOptions({
  name: "RadioGroup",
})

const props = withDefaults(defineProps<RadioGroupProps>(), {
  labelKey: "label", //默认值
  valueKey: "value", //默认值
  radioType: "radio",
})

const model = defineModel<Val>()

const emit = defineEmits<RadioGroupEmits>()

const cls = bem("radio-group")

const radioModels = ref<boolean[]>([])

const handleUpdate = (
  checked: boolean,
  item: Record<string, any>,
  index: number
) => {
  model.value = item[props.valueKey]
  radioModels.value = radioModels.value.map((_, i) =>
    i === index ? checked : false
  )
  emit("onChange", model.value!, item)
}

const compareDisabled = (index: number) => {
  if (props.disabledIndex instanceof Array) {
    return props.disabledIndex.includes(index)
  }
  if (Number(props.disabledIndex) == index + 1) {
    return true
  }
}

onMounted(() => {
  radioModels.value = Array(props.data?.length ?? 0).fill(false) // 初始化数组
  const selectedIndex = props.data?.findIndex(
    (item) => item?.[props.valueKey] === model.value
  )

  if (selectedIndex != -1) {
    const labelValue = props.data![selectedIndex!]?.[props.labelKey]
    if (labelValue !== undefined) {
      radioModels.value[selectedIndex!] = labelValue
    }
  }

})
</script>
