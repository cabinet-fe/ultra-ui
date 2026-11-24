<template>
  <div>
    <div>水印</div>
    <u-watermark text="丹书铁卷菠萝梦" append-to-body :route="-30"> </u-watermark>
  </div>
</template>

<script lang="ts" setup>
import { UWatermark } from '@veltra/desktop'
const list = [] as any
for (var i = 0; i <= 100; i++) {
  list.push(
    '水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印'
  )
}
</script>

<style lang="scss" scoped></style>
