<template>
  <div>
    <div>
      <u-button @click="setValue">设置初始值</u-button>
    </div>

    <!-- <CustomCard title="基础用法">
      <UTextEditor v-model="modelValue" height="500px" />
    </CustomCard>

    <CustomCard title="禁用">
      <UTextEditor v-model="modelValue" height="500px" disabled />
    </CustomCard>

    <CustomCard title="只读">
      <UTextEditor v-model="modelValue" height="500px" readonly />
    </CustomCard> -->
  </div>
</template>
<script lang="ts" setup>
// import CustomCard from '../card/custom-card.vue'
import { shallowRef } from 'vue'

const modelValue = shallowRef()

function setValue() {
  modelValue.value = '<p>你好</p><p>世界</p>'
}
</script>
