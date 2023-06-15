<template>
  <div>
    <div>
      pop被设计为一个单例的弹框, 单例的弹框可以大量地减少多数据渲染的内存占用,
      同时减少 dom的渲染开销
    </div>

    <u-popup :inst="inst">
      po
    </u-popup>
  </div>
</template>

<script lang="ts" setup>

</script>
