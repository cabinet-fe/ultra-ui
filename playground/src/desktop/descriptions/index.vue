<template>
  <div>
    <CustomCard title="基础用法（多列键值对详情，无边框）">
      <u-descriptions title="订单信息">
        <u-descriptions-item label="订单编号">VLT20261004001</u-descriptions-item>
        <u-descriptions-item label="下单时间">2026-10-04 10:23:45</u-descriptions-item>
        <u-descriptions-item label="支付方式">企业账户</u-descriptions-item>
        <u-descriptions-item label="收货人">吴同学</u-descriptions-item>
        <u-descriptions-item label="联系电话">138****6688</u-descriptions-item>
        <u-descriptions-item label="收货地址">
          浙江省杭州市西湖区文三路 90 号东部软件园 5 号楼 3 层
        </u-descriptions-item>
      </u-descriptions>

      <p class="descriptions-demo__tip">
        默认 3 列、无边框；column 控制每行键值对列数，超出自动换行。
      </p>
    </CustomCard>

    <CustomCard title="边框模式与列数（border、column=2）">
      <u-descriptions title="服务器详情" border :column="2">
        <u-descriptions-item label="主机名">hz-prod-web-01</u-descriptions-item>
        <u-descriptions-item label="内网 IP">10.0.12.34</u-descriptions-item>
        <u-descriptions-item label="规格">8 核 16GB</u-descriptions-item>
        <u-descriptions-item label="系统盘">200GB SSD</u-descriptions-item>
        <u-descriptions-item label="镜像">Ubuntu 24.04 LTS</u-descriptions-item>
        <u-descriptions-item label="到期时间">2027-06-30</u-descriptions-item>
      </u-descriptions>

      <p class="descriptions-demo__tip">border 开启单元格描边与键名底色；长值自动换行。</p>
    </CustomCard>

    <CustomCard title="垂直布局与尺寸（layout=vertical、size）">
      <div class="descriptions-demo__row">
        <u-descriptions title="任务详情（small）" border layout="vertical" size="small" :column="2">
          <u-descriptions-item label="任务名">季度数据归档</u-descriptions-item>
          <u-descriptions-item label="负责人">李工</u-descriptions-item>
          <u-descriptions-item label="状态">
            <span>执行中（预计 10-05 08:00 完成）</span>
          </u-descriptions-item>
          <u-descriptions-item label="备注">数据源为上月增量日志</u-descriptions-item>
        </u-descriptions>
      </div>

      <div class="descriptions-demo__row">
        <u-descriptions title="任务详情（large）" border layout="vertical" size="large" :column="2">
          <u-descriptions-item label="任务名">季度数据归档</u-descriptions-item>
          <u-descriptions-item label="负责人">李工</u-descriptions-item>
          <u-descriptions-item label="状态">
            <span>执行中（预计 10-05 08:00 完成）</span>
          </u-descriptions-item>
          <u-descriptions-item label="备注">数据源为上月增量日志</u-descriptions-item>
        </u-descriptions>
      </div>

      <p class="descriptions-demo__tip">
        vertical 布局键名行与内容行上下成组；size 影响字号与内边距。
      </p>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import CustomCard from '../card/custom-card.vue'
</script>

<style scoped>
.descriptions-demo__row {
  margin-bottom: 16px;
}

.descriptions-demo__tip {
  margin: 8px 0 0;
  font-size: 13px;
}
</style>
