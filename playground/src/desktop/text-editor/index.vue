<template>
  <div>
    <div>
      <u-button @click="setValue">设置初始值</u-button>
    </div>

    <URichTextEditor v-model="modelValue" />

    <URichTextEditor v-model="modelValue" disabled />

    <URichTextEditor v-model="modelValue" readonly />

    <h3>图片延迟上传</h3>
    <p>
      粘贴 / 拖拽 / 工具栏插入图片，本地即时预览，提交时统一上传；点击图片可选中，拖动右下角手柄缩放
    </p>

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
  const image = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200"><rect width="100%" height="100%" fill="#4a7dff"/><text x="50%" y="50%" fill="#fff" font-size="24" text-anchor="middle" dominant-baseline="middle">360 x 200</text></svg>'
  )}`
  modelValue.value = `<p>你好</p><p><img src="${image}" alt="示例图"></p>`
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
