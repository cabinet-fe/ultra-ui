<template>
  <div>
    <CustomCard title="设置新的模型数据"> <ChangeProxyData /> </CustomCard>
    <CustomCard title="完整表单"> <FullForm /> </CustomCard>
    <CustomCard title="可查看初始数据"> <InitData /> </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'
import ChangeProxyData from './change-proxy-data.vue'
import FullForm from './full.vue'
import InitData from './init-data.vue'
</script>

<style scoped lang="scss">
.list {
  border: 1px solid #eee;
  margin-top: 100px;
  &-item {
    height: 32px;
    line-height: 32px;
    padding: 0 8px;
    border-bottom: 1px solid #eee;
    cursor: default;
    background-color: #fff;
    user-select: none;
    transition: transform 0.25s;

    &:last-child {
      border: none;
    }
  }
}
</style>
