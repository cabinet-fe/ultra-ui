<template>
  <div>
    <div>pop是所有的弹出型组件的基础组件，提供了弹框最核心的内容。</div>

    <div style="display: flex; justify-content: space-between">
      <u-popup style="width: 900px; ">
        <template #trigger>
          <u-button>提示框1</u-button>
        </template>

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
      </u-popup>

      <u-popup style="width: 900px; height: 300px; background-color: #ccc">
        <template #trigger>
          <u-button>提示框2</u-button>
        </template>

        内容2
      </u-popup>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shallowReactive } from 'vue'

const scope = shallowReactive({
  visible: true
})
</script>
