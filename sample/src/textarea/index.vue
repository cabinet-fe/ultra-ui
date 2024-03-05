<template>
    <u-textarea v-model="textareaValue1" autosize height="200px"></u-textarea>
    <u-textarea v-model="textareaValue2" disabled></u-textarea>
    <u-textarea v-model="textareaValue3" resize="vertical"></u-textarea>
    <u-textarea v-model="textareaValue4" resize="horizontal"></u-textarea>
    <u-textarea v-model="textareaValue5" :maxlength="20" show-count></u-textarea>

    <u-button @click="btn()">获取</u-button>
</template>

<script setup lang="ts">
import {ref} from "vue"

let textareaValue1 = ref("")
let textareaValue2 = ref("默认值")
let textareaValue3 = ref("垂直拖")
let textareaValue4 = ref("水平拖")
let textareaValue5 = ref(123123)


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
