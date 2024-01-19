<template>
  <div>
    <h2>单选框按钮样式</h2>
    <div class="item">
      <h6>基础展示/背景btn选中、radio选中</h6>
      <u-radio-button v-model="radio1" checkedColor="rgba(144, 115, 255, 0.5)"
        >汉字1{{ radio1 }}</u-radio-button
      >
      <u-radio-button v-model="radio1">汉字2</u-radio-button>
    </div>
    <div class="item">
      <h6>基础展示 禁用</h6>
      <u-radio-button disabled>汉字2</u-radio-button>
    </div>

    <div class="item">
      <h6>单选框组</h6>
      <!-- <p>{{ dataGroup }}</p> -->
      <u-radio-group
        radioType="btn"
        :data="dataGroup"
        labelValue="name"
        keyValue="id"
        v-model="dataGroup1Value"
      />
      <!-- <p>{{ "返回值:" + dataGroup1Value }}</p> -->
    </div>

    <div class="item">
      <h6>单选框组/回显</h6>
      <!-- <p>{{ dataGroup2 }}</p> -->
      <u-radio-group
        radioType="btn"
        :data="dataGroup2"
        labelValue="name"
        keyValue="age"
        v-model="dataGroup2Value"
        disabledAll
      />
      <!-- <p>{{ "返回值:" + dataGroup2Value }}</p> -->
    </div>

    <div class="item">
      <h6>单选框组 背景色</h6>
      <!-- <p>{{ dataGroup3 }}</p> -->
      <u-radio-group
        :checkedColor="'rgba(144,115,255,0.5)'"
        radioType="btn"
        :data="dataGroup3"
        labelValue="name"
        keyValue="age"
        v-model="dataGroup3Value"
      />
      <!-- <p>{{ "返回值:" + dataGroup3Value }}</p> -->
    </div>

    <div class="item">
      <h6>单选框组 禁用单个</h6>
      <!-- <p>{{ dataGroup4 }}</p> -->
      <u-radio-group
        :checkedColor="'rgba(144,115,255,0.5)'"
        radioType="btn"
        :data="dataGroup4"
        labelValue="name"
        keyValue="age"
        v-model="dataGroup4Value"
        :disabled-index="4"
      />
      <!-- <p>{{ "返回值:" + dataGroup4Value }}</p> -->
    </div>

    <div class="item">
      <h6>单选框组 禁用多个</h6>
      <!-- <p>{{ dataGroup5 }}</p> -->
      <u-radio-group
        :checkedColor="'rgba(144,115,255,0.5)'"
        radioType="btn"
        :data="dataGroup5"
        labelValue="name"
        keyValue="age"
        v-model="dataGroup5Value"
        :disabled-index="[1, 3]"
      />
      <!-- <p>{{ "返回值:" + dataGroup5Value }}</p> -->
    </div>
    <div class="item">
      <h6>尺寸</h6>
      <u-radio-button v-model="radio3" size="large">大</u-radio-button>
      <u-radio-button v-model="radio4">默认</u-radio-button>
      <u-radio-button v-model="radio5" size="small">小</u-radio-button>
    </div>

    <br /><br /><br />
    <u-button @click="btn">获取</u-button>
    {{ back }}
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue"

let radio1 = ref(false)
let radio3 = ref(false)
let radio4 = ref(false)
let radio5 = ref(false)

const dataGroup = [
  {name: "张三", id: 1},
  {name: "李四", id: 2},
  {name: "王五", id: 3},
]

const dataGroup2 = [
  {name: "张三", age: 18},
  {name: "李四", age: 22},
  {name: "张三", age: 1},
  {name: "李四", age: 2},
]

const dataGroup3 = [
  {name: "张三", age: 18},
  {name: "李四", age: 22},
  {name: "李四", age: 2},
]

const dataGroup4 = [
  {name: "张三", age: 1},
  {name: "李四", age: 2},
  {name: "李四", age: 3},
  {name: "张三", age: 4},
]

const dataGroup5 = [
  {name: "张三", age: 1},
  {name: "李四", age: 2},
  {name: "李四", age: 3},
  {name: "张三", age: 4},
]

let dataGroup1Value = ref("")

let dataGroup2Value = ref(22)

let dataGroup3Value = ref("")

let dataGroup4Value = ref("")

let dataGroup5Value = ref("")

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
</style>
