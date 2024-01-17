<template>
  <div class="box">
    <div class="box-item">
      <IndexMore />
    </div>

    <div class="box-item">
      <IndexBtn />
    </div>
  </div>
</template>

<script setup lang="ts">
import IndexMore from "./index-more.vue"

import IndexBtn from "./index-btn.vue"
</script>

<style lang="scss" scoped>
.box {
  display: flex;
  div {
    flex: 1;
    margin-left: 10px;
  }
}
</style>
