<template>
  <div class="box">
    <div class="box-item">
      <!-- <IndexMore /> -->
    </div>

    <div class="box-item">
      <!-- <IndexBtn /> -->
    </div>

    <CustomCard title="基础使用">
      <u-radio v-model="radio1" value="1">选项一</u-radio>
      <u-radio v-model="radio1" value="2" label="选项二" />
      <u-radio v-model="radio1" value="3">选项三</u-radio>
    </CustomCard>
    <CustomCard title="基础使用">
      <u-radio v-model="radio1" value="1">选项一</u-radio>
      <u-radio v-model="radio1" value="2" label="选项二" />
      <u-radio v-model="radio1" value="3">选项三</u-radio>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'

const radio1 = shallowRef('1')
</script>

<style lang="scss" scoped>
.box {
  // display: flex;
  // div {
  //   flex: 1;
  //   margin-left: 10px;
  // }

  .u-card {
    margin-bottom: 20px;
  }
}
</style>
