<template>
  <div>
    <div>水印</div>
    <u-watermark text="watermark" font-size="60" font-color="#fff">
      <p v-for="item in list">
        {{ item }}
      </p>
    </u-watermark>

    <!-- <u-watermark
      image="https://q9.itc.cn/q_70/images01/20240325/c8916e957ea944a38df28e911e117a5f.png"
    >
      111111
      <p v-for="item in list">
        {{ item }}
      </p>
    </u-watermark> -->
  </div>
</template>

<script lang="ts" setup>
import type Watermark from 'ultra-ui/components/watermark/watermark.vue'

const list = []
for (var i = 0; i <= 100; i++) {
  list.push(
    '水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印'
  )
}
</script>

<style lang="scss" scoped></style>
