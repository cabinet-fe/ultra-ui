<template>
  <div :class="[cls.b, radioType == 'btn' ? cls.m('button') : '']">
    <u-radio
      v-if="radioType == 'radio'"
      v-for="(item, index) in modelData"
      v-model="item.check"
      :itemValue="item"
      @update:modelDataValue="onUpdate"
      :disabledIndex="compareDisabled(index)"
      :disabled="disabled"
    >
      {{ item[labelValue] }}{{ item[keyValue] }}
    </u-radio>
    <u-radio-button
      :class="cls.m('button-item')"
      v-else
      v-for="(itemBtn, index) in modelData"
      v-model="itemBtn.check"
      :itemValue="itemBtn"
      @update:modelDataValue="onUpdate"
      :checked-color="checkedColor"
      :disabledIndex="compareDisabled(index)"
      :disabled="disabled"
    >
      {{ itemBtn[labelValue] }}{{ itemBtn[keyValue] }}
    </u-radio-button>
  </div>
</template>

<script lang="ts" setup>
import type {
  RadioGroupProps,
  RadioGroupEmits,
} from "@ui/types/components/radio-group"
import {bem} from "@ui/utils"
import URadio from "../radio/radio.vue"
import URadioButton from "../radio-button/radio-button.vue"

import {ref} from "vue"

defineOptions({
  name: "RadioGroup",
})

const props = withDefaults(defineProps<RadioGroupProps>(), {
  labelValue: "label", //默认值
  keyValue: "value", //默认值
  radioType: "radio",
})

const emit = defineEmits<RadioGroupEmits>()

const cls = bem("radio-group")

props.data.forEach((item) => {
  item.check = false
  if (props.modelValue === item[props.keyValue]) {
    item.check = true
    emit("onChange", props.keyValue, item)
  }
})

let modelData = ref(props.data)

let modelDataValue = ref(props.modelValue)

const onUpdate = (value: boolean, item: Record<string, any>) => {
  modelData.value.forEach((dataItem) => {
    dataItem.check = dataItem === item && value
    if (dataItem.check) {
      modelDataValue.value = dataItem[props.keyValue]
      emit("onChange", props.keyValue, dataItem)
      emit("update:modelValue", modelDataValue.value)
    }
  })
}

const compareDisabled = (index: number) => {
  if (typeof props.disabledIndex == "object") {
    if (props.disabledIndex.indexOf(index) != -1) {
      return true
    }
  }
  if (Number(props.disabledIndex) == index + 1) {
    return true
  }
}
</script>
