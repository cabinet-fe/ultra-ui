<template>
  <div>
    <div>
      <p>对话框是是常用的交互型组件。</p>

      <p>在过去对话框有一些痛点：</p>

      <p>
        1. 在刚进入页面时还没打开弹框数据也会先渲染，
        只能在组件外部用v-if配合使用，而且会有每一次打开都会重新渲染数据渲染的问题
      </p>

      <p>2. 弹框不支持缩小和缓存</p>
    </div>

    <u-button @click="visible = true">打开</u-button>
    <div v-show="visible">
      {{ getContent() }}
    </div>

    <u-dialog v-model="visible" style="width: 900px;" title="弹框">
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>
      <p>内容</p>

    </u-dialog>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
const visible = shallowRef(false)

const getContent = () => {
  return Math.random() + ''
}
</script>

<style lang="scss" scoped></style>
