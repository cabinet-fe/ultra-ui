<template>
  <div>
    <CustomCard title="使用">
      <u-empty />
    </CustomCard>

    <CustomCard title="块级模式（撑满父容器并居中）">
      <div class="block-host">
        <u-empty block />
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'
</script>

<style scoped>
.block-host {
  display: flex;
  height: 200px;
  border: 1px dashed var(--u-border-color);
}
</style>
