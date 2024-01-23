<template>
  <div :class="[cls.b, radioType == 'btn' ? cls.m('button') : '']">
    <template v-if="radioType == 'radio'">
      <u-radio
        v-for="(item, index) in data"
        v-model="model"
        :value="item[labelKey]"
        :itemValue="item"
        @update:modelDataValue="onUpdate"
        :disabled="disabled || compareDisabled(index)"
      />
    </template>

    <template v-else>
      <u-radio-button
        :class="cls.m('button-item')"
        v-for="(itemBtn, index) in data"
        v-model="model"
        :value="itemBtn[labelKey]"
        :itemValue="itemBtn"
        @update:modelValue="onUpdate"
        :checked-color="checkedColor"
        :disabled="disabled || compareDisabled(index)"
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

props.data!.forEach((item) => {
  item.check = false
  if (model.value === item[props.labelKey]) {
    emit("onChange", props.labelKey, item)
  }
})

const onUpdate = (value: boolean, item: Record<string, any>) => {
  console.log(value)
  model.value = item[props.labelKey]!
  // modelData.value.forEach((dataItem) => {
  //   model.value = dataItem === item && value
  //   if (dataItem.check) {
  //     modelDataValue.value = dataItem[props.keyValue]
  //     emit("onChange", props.keyValue, dataItem)
  //     emit("update:modelValue", modelDataValue.value)
  //   }
  // })
}

const compareDisabled = (index: number) => {
  if (props.disabledIndex instanceof Array) {
    return props.disabledIndex.includes(index)
  }
  if (Number(props.disabledIndex) == index + 1) {
    return true
  }
}
</script>
