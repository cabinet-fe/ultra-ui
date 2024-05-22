<template>
  <div :class="cls.e('bar')" ref="barRef">
    <select class="ql-size">
      <option value="small"></option>
      <option selected></option>
      <option value="large"></option>
      <option value="huge"></option>
    </select>

    <UTip content="加粗">
      <button class="ql-bold" />
    </UTip>

    <UTip content="斜体">
      <button class="ql-italic" />
    </UTip>

    <UTip content="下划线">
      <button class="ql-underline" />
    </UTip>

    <UTip content="上传图片">
      <button class="ql-image" />
    </UTip>

    <UTip content="插入链接">
      <button class="ql-link" />
    </UTip>

    <UTip content="代码块">
      <button class="ql-code-block" />
    </UTip>

    <UTip content="清除格式">
      <button class="ql-clean" />
    </UTip>

    <!--
    <button class="ql-script" value="sub"></button>
    <button class="ql-script" value="super"></button> -->

    <!-- 自定义 -->
    <!-- <button id="custom-button">

    </button> -->
  </div>
</template>
<script lang="ts" setup>
import { bem } from '@ui/utils'
import { shallowRef } from 'vue'
import { UTip } from '../tip'

const barRef = shallowRef()

const cls = bem('text-editor')

// const customButton = document.querySelector('#custom-button')

// customButton!.addEventListener('click', function () {
//   console.log('Clicked!')
// })

defineExpose({
  barRef
})
</script>
