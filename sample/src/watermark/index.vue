<template>
  <div>
    <div>水印</div>
    <u-watermark text="丹书铁卷菠萝梦" append-to-body :route="-30"> </u-watermark>

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
const list = [] as any
for (var i = 0; i <= 100; i++) {
  list.push(
    '水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印水印'
  )
}
</script>

<style lang="scss" scoped></style>
