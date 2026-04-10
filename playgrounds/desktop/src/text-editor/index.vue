<template>
  <div>
    <div>
      <u-button @click="setValue">设置初始值</u-button>
    </div>

    <URichTextEditor v-model="modelValue" />

    <URichTextEditor v-model="modelValue" disabled />

    <URichTextEditor v-model="modelValue" readonly />
  </div>
</template>
<script lang="ts" setup>
import { shallowRef } from 'vue'

const modelValue = shallowRef()

function setValue() {
  modelValue.value = '<p>你好</p><p>世界</p>'
}
</script>
