<template>
  <div>
    <div>
      <u-button @click="setValue">设置初始值</u-button>
    </div>

    <URichTextEditor v-model="modelValue" />

    <URichTextEditor v-model="modelValue" disabled />

    <URichTextEditor v-model="modelValue" readonly />

    <h3>图片延迟上传</h3>
    <p>粘贴 / 拖拽 / 工具栏插入图片，本地即时预览，提交时统一上传</p>

    <URichTextEditor ref="rte" v-model="content" />

    <div>
      <u-button @click="submit">提交（上传图片）</u-button>
    </div>

    <pre v-if="submitted">{{ submitted }}</pre>
  </div>
</template>
<script lang="ts" setup>
import { shallowRef, useTemplateRef } from 'vue'

const modelValue = shallowRef()

const content = shallowRef('')
const submitted = shallowRef('')

const rte = useTemplateRef('rte')

function setValue() {
  modelValue.value = '<p>你好</p><p>世界</p>'
}

/** 模拟上传：800ms 后返回服务器地址 */
function mockUpload(file: File): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(`https://cdn.example.com/${encodeURIComponent(file.name)}`), 800)
  })
}

async function submit() {
  if (!rte.value) return
  submitted.value = await rte.value.uploadImages(mockUpload)
}
</script>
