<template>
<div>
  <div>上下文组件是一种弥补在模板中无法进行复杂计算的手段</div>

  <u-context :scope="scope" #default="{ ctx }">

  </u-context>
</div>
</template>

<script lang="ts" setup>
import { shallowReactive } from 'vue'

const scope = () => shallowReactive({

})
</script>