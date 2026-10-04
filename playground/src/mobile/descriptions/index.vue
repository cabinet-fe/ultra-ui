<template>
  <div class="demo">
    <section>
      <h3>基础用法（单列键值对详情）</h3>
      <UDescriptions title="订单信息">
        <UDescriptionsItem label="订单编号">VLT20261004001</UDescriptionsItem>
        <UDescriptionsItem label="下单时间">2026-10-04 10:23:45</UDescriptionsItem>
        <UDescriptionsItem label="支付方式">企业账户</UDescriptionsItem>
        <UDescriptionsItem label="收货人">吴同学</UDescriptionsItem>
        <UDescriptionsItem label="联系电话">138****6688</UDescriptionsItem>
        <UDescriptionsItem label="收货地址">
          浙江省杭州市西湖区文三路 90 号东部软件园 5 号楼 3 层
        </UDescriptionsItem>
      </UDescriptions>

      <p class="tip">窄屏单列堆叠：键名在左、内容右对齐，长值自动换行。</p>
    </section>

    <section>
      <h3>边框模式（border）</h3>
      <UDescriptions title="服务器详情" border>
        <UDescriptionsItem label="主机名">hz-prod-web-01</UDescriptionsItem>
        <UDescriptionsItem label="内网 IP">10.0.12.34</UDescriptionsItem>
        <UDescriptionsItem label="规格">8 核 16GB</UDescriptionsItem>
        <UDescriptionsItem label="系统盘">200GB SSD</UDescriptionsItem>
        <UDescriptionsItem label="镜像">Ubuntu 24.04 LTS</UDescriptionsItem>
        <UDescriptionsItem label="到期时间">2027-06-30</UDescriptionsItem>
      </UDescriptions>
    </section>

    <section>
      <h3>垂直布局（layout=vertical）</h3>
      <UDescriptions title="任务详情" border layout="vertical" size="large">
        <UDescriptionsItem label="任务名">季度数据归档</UDescriptionsItem>
        <UDescriptionsItem label="负责人">李工</UDescriptionsItem>
        <UDescriptionsItem label="状态">
          <span>执行中（预计 10-05 08:00 完成）</span>
        </UDescriptionsItem>
        <UDescriptionsItem label="备注">数据源为上月增量日志</UDescriptionsItem>
      </UDescriptions>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UDescriptions, UDescriptionsItem } from '@veltra/mobile'
import '@veltra/mobile/components/descriptions/style'
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证单列布局无横向溢出
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

.tip {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
