<template>
  <div id="bar" :class="cls.e('bar')" ref="barRef">
    <select class="ql-size">
      <option value="small">小</option>
      <option selected>正常</option>
      <option value="large">大</option>
      <option value="huge">嘎嘎大</option>
    </select>

    <UTip
      :content="item.content"
      v-for="item in injected.textEditorProps.toolbar ?? [
        { content: '加粗', bar: 'bold' },
        { content: '斜体', bar: 'italic' },
        { content: '下划线', bar: 'underline' },
        { content: '上传图片', bar: 'image' },
        { content: '插入链接', bar: 'link' },
        { content: '代码块', bar: 'code-block' },
        { content: '清除格式', bar: 'clean' }
      ]"
    >
      <button :class="`ql-${item.bar}`" />
    </UTip>

    <!-- 自定义 -->
    <!-- <button id="custom-button">

    </button> -->
  </div>
</template>
<script lang="ts" setup>
import { bem } from '@ui/utils'
import { inject, shallowRef } from 'vue'
import { UTip } from '../tip'
import { TextEditorDIKey } from './di'

const barRef = shallowRef()

const cls = bem('text-editor')

const injected = inject(TextEditorDIKey)!

// const customButton = document.querySelector('#custom-button')

// customButton!.addEventListener('click', function () {
//   console.log('Clicked!')
// })

defineExpose({
  barRef
})
</script>
