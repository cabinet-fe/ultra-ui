<template>
  <div>
    <div>上下文组件是一种弥补在模板中无法进行复杂计算的手段</div>

    <u-context :scope="{ isLess: num < 50 }" #default="scope">
      {{ scope }}
    </u-context>
  </div>
</template>

<script lang="ts" setup>
const num = Math.random() * 100
</script>
