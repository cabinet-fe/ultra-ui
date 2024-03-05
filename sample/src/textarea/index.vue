<template>
  <div>
    <u-textarea v-model="textareaValue1" autosize :rows="10" />
    <u-textarea v-model="textareaValue2" disabled />
    <u-textarea v-model="textareaValue3" />
    <u-textarea v-model="textareaValue4" resizable="none" />
    <u-textarea v-model="textareaValue5" :maxlength="20" show-count />

    <u-button @click="btn()">获取</u-button>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue"

let textareaValue1 = ref("自适应文本域")
let textareaValue2 = ref("回显")
let textareaValue3 = ref("垂直拖")
let textareaValue4 = ref("禁止拖拽")
let textareaValue5 = ref("输入长度限制")

const btn = () => {
  let str = `
  textareaValue1: ${textareaValue1.value}
  textareaValue2: ${textareaValue2.value}
  textareaValue3: ${textareaValue3.value}
  textareaValue4: ${textareaValue4.value}
  textareaValue5: ${textareaValue5.value}
  `
  alert(str)
}
</script>

<style lang="" scoped></style>
