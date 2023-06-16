<template>
  <div>
    <div>
      pop被设计为一个单例的弹框, 单例的弹框可以大量地减少多数据渲染的内存占用,
      同时减少, dom的渲染开销 简而言之就是, 所有pop中的
    </div>

    <u-context :scope="scope" #default="{ ctx }">
      <u-button @click="ctx.visible = !ctx.visible">提示框</u-button>
      <u-popup v-model="ctx.visible">啊说服对方</u-popup>
    </u-context>

    <u-popup>
      <template #trigger>
        <u-button>提示框1</u-button>
      </template>

      内容1
    </u-popup>

    <u-popup>
      <template #trigger>
        <u-button>提示框2</u-button>
      </template>

      内容2
    </u-popup>
  </div>
</template>

<script lang="ts" setup>
import { shallowReactive } from 'vue'

const scope = () => {
  return shallowReactive({
    visible: true
  })
}
</script>
