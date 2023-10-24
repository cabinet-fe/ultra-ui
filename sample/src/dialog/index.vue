<template>
  <div>
    <div>
      <p>对话框是是常用的交互型组件。</p>

      <p>在过去对话框有一些痛点：</p>

      <p>1. 在刚进入页面时还没打开弹框数据也会先渲染， 只能在组件外部用v-if配合使用，而且会有每一次打开都会重新拉取数据渲染的问题</p>

      <p>2. 弹框不支持初始化</p>
    </div>


  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import type { DialogExposed } from 'ultra-ui'

const visible = shallowRef(false)
const dialogRef = shallowRef<DialogExposed>()
</script>

<style lang="scss" scoped></style>
