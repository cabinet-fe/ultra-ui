<template>
  <div>
    <u-textarea v-model="textareaValue1" :rows="6" autosize/>
    <u-textarea v-model="textareaValue2" disabled />
    <u-textarea v-model="textareaValue3" readonly/>
    <u-textarea v-model="textareaValue4" :resize="false"/>
    <u-textarea v-model="textareaValue5" :maxlength="maxlength" show-count/>
    <u-textarea v-model="textareaValue6" clearable :maxlength="maxlength" show-count />
    <u-button @click="btn()">获取</u-button>
    <u-button @click="maxlength += 10">改变maxlength</u-button>
    {{ maxlength }}
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import {ref} from "vue"

let textareaValue1 = ref("自适应文本域")
let textareaValue2 = ref("回显")
let textareaValue3 = ref("只读")
let textareaValue4 = ref("禁止拖拽")
let textareaValue5 = ref("输入长度限制")
let textareaValue6 = ref('可清空可清空可清空可清空可清空可清空可清空可清空可清空可清空')
let maxlength = shallowRef(100)
const btn = () => {
  let str = `
  textareaValue1: ${textareaValue1.value}
  textareaValue2: ${textareaValue2.value}
  textareaValue3: ${textareaValue3.value}
  textareaValue4: ${textareaValue4.value}
  textareaValue5: ${textareaValue5.value}
  textareaValue6: ${textareaValue6.value}
  `
  alert(str)
}
</script>

<style lang="" scoped></style>
