<template>
  <div>
    <div>pop是所有的弹出型组件的基础组件，提供了弹框最核心的内容。</div>

    <div style="display: flex; justify-content: space-between">
      <u-popup>
        <template #trigger>
          <u-button>提示框1</u-button>
        </template>

        哦埃及的案件对接安静的就
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
