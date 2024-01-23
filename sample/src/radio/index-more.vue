<template>
  <div class="more">
    <h2>单选框</h2>
    <div class="item">
      <h6>基础展示</h6>
      {{ radio1 }}
      <u-radio v-model="radio1" value="1"></u-radio>
      <u-radio v-model="radio1" value="2"></u-radio>
    </div>

    <div class="item">
      <h6>单选框组</h6>
      <p>{{ dataGroup }}</p>
      <u-radio-group
        :data="dataGroup"
        labelKey="name"
        valueKey="id"
        v-model="dataGroup1Value"
      />
      <p>{{ "返回值:" + dataGroup1Value }}</p>
    </div>

    <div class="item">
      <h6>单选框组/回显</h6>
      <p>{{ dataGroup2 }}</p>
      <u-radio-group
        :data="dataGroup2"
        labelKey="name"
        valueKey="age"
        v-model="dataGroup2Value"
        disabled
      />
      <p>{{ "返回值:" + dataGroup2Value }}</p>
    </div>
    <u-button @click="btn">获取</u-button>
    {{ back }}
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue"

let radio1 = ref("2")

const dataGroup = [
  {name: "张三", id: 1},
  {name: "李四", id: 2},
]

const dataGroup2 = [
  {name: "张三", age: 18},
  {name: "李四", age: 22},
]
let dataGroup1Value = ref("")

let dataGroup2Value = ref("张三")

let back = ref("")

const btn = () => {
  back.value = `radio1:
      ${radio1.value},
      dataGroup1Value:
      ${dataGroup1Value.value},
      dataGroup2Value:
      ${dataGroup2Value.value}`
}
btn()
</script>

<style lang="scss" scoped>
.item {
  h6 {
    font-size: 16px;
    padding: 10px 0;
  }
}
.more {
  height: calc(100vh - 10px);
  border-right: 1px solid #ddd;
}
</style>
