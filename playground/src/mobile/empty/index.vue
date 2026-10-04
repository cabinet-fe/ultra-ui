<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <UEmpty />
    </section>

    <section>
      <h3>自定义描述</h3>
      <UEmpty text="还没有订单，去逛逛吧" />
    </section>

    <section>
      <h3>图标尺寸</h3>
      <div class="row">
        <UEmpty :size="32" text=" " />
        <UEmpty :size="48" text=" " />
        <UEmpty :size="64" text=" " />
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UEmpty } from '@veltra/mobile'
import '@veltra/mobile/components/empty/style'
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 24px;
}
</style>
