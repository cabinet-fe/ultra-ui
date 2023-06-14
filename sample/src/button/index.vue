<template>
  <div>
    <!-- 类别展示 -->
    <div class="space">
      <u-button>默认</u-button>
      <u-button type="primary">主题</u-button>
      <u-button type="success">成功</u-button>
      <u-button type="warning">警告</u-button>
      <u-button type="danger">危险</u-button>
      <u-button type="info">信息</u-button>
    </div>

    <!-- size -->
    <div class="space">
      <u-button type="primary" size="large">大按钮</u-button>
      <u-button type="primary">中按钮</u-button>
      <u-button type="primary" size="small">小按钮</u-button>
    </div>

    <!-- circle -->
    <div class="space">
      <u-button type="primary" circle :icon="Edit"></u-button>
      <u-button size="small" circle>主</u-button>
    </div>

    <!-- disabled -->
    <div class="space">
      <u-button disabled>默认</u-button>
      <u-button disabled type="primary">主题</u-button>
      <u-button disabled type="success">成功</u-button>
      <u-button disabled type="warning">警告</u-button>
      <u-button disabled type="danger">危险</u-button>
      <u-button disabled type="info">信息</u-button>
    </div>

    <!-- loading -->
    <div class="space">
      <u-button loading type="primary">默认</u-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Edit } from 'icon-ultra'
</script>

<style lang="scss">
.space {
  padding: 8px;
  & > * {
    margin-right: 8px;
  }
}
</style>
