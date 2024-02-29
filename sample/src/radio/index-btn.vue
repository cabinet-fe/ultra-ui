<template>
  <div>
    <h2>单选框按钮样式</h2>
    <div class="item">
      <h6>基础展示</h6>
      {{ radio1 }}
      <u-tip model-value="model:radio1 value:汉字1" position="right">
        <u-radio-button v-model="radio1" value="汉字1" :size="radio3" />
      </u-tip>
      <u-tip model-value="model:radio1 value:汉字2" position="bottom">
        <u-radio-button v-model="radio1" value="汉字2" :size="radio3" />
      </u-tip>
    </div>
    <div class="item">
      <h6>基础展示 禁用</h6>
      <u-radio-button
        value="汉字2"
        v-model="radio2"
        :size="radio3"
        disabled
      ></u-radio-button>
    </div>

    <div class="item">
      <h6>单选框组</h6>
      <!-- <p>{{ dataGroup }}</p> -->
      <u-radio-group
        radioType="btn"
        :data="dataGroup"
        labelKey="name"
        valueKey="id"
        v-model="dataGroup1Value"
        :size="radio3"
      />
      <!-- <p>{{ "返回值:" + dataGroup1Value }}</p> -->
    </div>

    <div class="item">
      <h6>单选框组/回显</h6>
      <!-- <p>{{ dataGroup2 }}</p> -->
      <u-radio-group
        radioType="btn"
        :data="dataGroup2"
        labelKey="name"
        valueKey="age"
        v-model="dataGroup2Value"
        disabled
        :size="radio3"
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
        labelKey="name"
        valueKey="age"
        v-model="dataGroup3Value"
        :size="radio3"
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
        labelKey="name"
        valueKey="age"
        v-model="dataGroup4Value"
        :disabled-index="4"
        :size="radio3"
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
        labelKey="name"
        valueKey="age"
        v-model="dataGroup5Value"
        :disabled-index="[1, 3]"
        :size="radio3"
      />
      <!-- <p>{{ "返回值:" + dataGroup5Value }}</p> -->
    </div>
    <div class="item">
      <h6>尺寸</h6>
      <u-radio-button
        v-model="radio3"
        value="large"
        size="large"
      ></u-radio-button>
      <u-radio-button v-model="radio3" value="default"></u-radio-button>
      <u-radio-button
        v-model="radio3"
        value="small"
        size="small"
      ></u-radio-button>
      {{ radio3 }}
    </div>

    <br /><br /><br />
    <u-button @click="btn">获取</u-button>
    {{ back }}
  </div>
</template>

<script setup lang="ts">
import type {ComponentSize} from "ultra-ui"
import {ref, shallowRef} from "vue"

let radio1 = ref("")

let radio2 = ref("汉字2")

let radio3 = shallowRef<ComponentSize>("default")

const dataGroup = [
  {name: "张三", id: 1},
  {name: "李四", id: 2},
  {name: "王五", id: 3},
]

const dataGroup2 = [
  {name: "张三", age: 18},
  {name: "李四", age: 22},
  {name: "王五", age: 1},
  {name: "老六", age: 2},
]

const dataGroup3 = [
  {name: "张三", age: 18},
  {name: "李四", age: 22},
  {name: "王五", age: 2},
]

const dataGroup4 = [
  {name: "张三", age: 1},
  {name: "李四", age: 2},
  {name: "王五", age: 3},
  {name: "老六", age: 4},
]

const dataGroup5 = [
  {name: "张三", age: 1},
  {name: "李四", age: 2},
  {name: "王五", age: 3},
  {name: "老六", age: 4},
]

let dataGroup1Value = ref("王五")

let dataGroup2Value = ref(22)

let dataGroup3Value = ref("")

let dataGroup4Value = ref("")

let dataGroup5Value = ref("")

let back = ref("")

const btn = () => {
  back.value = `radio1:
      ${radio1.value}··················,
      radio2:
      ${radio2.value}··················,
      radio3:
      ${radio3.value}··················,
      dataGroup1Value:
      ${dataGroup1Value.value}··················,
      dataGroup2Value:
      ${dataGroup2Value.value}··················
      dataGroup3Value:
      ${dataGroup3Value.value}··················
      dataGroup4Value:
      ${dataGroup4Value.value}··················
      dataGroup5Value:
      ${dataGroup5Value.value}··················`
}
btn()
</script>

<style lang="scss" scoped>
.item {
  h6 {
    font-size: 16px;
    margin: 10px 0;
  }
}
</style>
