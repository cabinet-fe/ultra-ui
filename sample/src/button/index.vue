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
      <u-button type="primary" size="large">主题</u-button>
      <u-button type="success">成功</u-button>
      <u-button type="warning" size="small">警告</u-button>
    </div>

    <!-- circle -->
    <div class="space">
      <u-button type="primary" circle>主</u-button>
    </div>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss">
.space {
  padding: 8px;
  & > * {
    margin-right: 8px;
  }
}
</style>
