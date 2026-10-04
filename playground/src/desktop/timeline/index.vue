<template>
  <div>
    <CustomCard title="基础用法（节点、时间戳、内容）">
      <u-timeline>
        <u-timeline-item timestamp="2026-10-01 09:30" color="primary">
          创建部署任务：frontend / release-v2.4.0
        </u-timeline-item>
        <u-timeline-item timestamp="2026-10-02 14:12">
          构建产物上传完成，共 36 个文件
        </u-timeline-item>
        <u-timeline-item timestamp="2026-10-03 20:05" color="success">
          灰度环境验收通过，全量发布开始
        </u-timeline-item>
        <u-timeline-item timestamp="2026-10-04 08:00" color="success">
          发布完成，线上版本 v2.4.0
        </u-timeline-item>
      </u-timeline>

      <p class="timeline-demo__tip">不传 color 时为中性色节点；最后一个节点不渲染尾线。</p>
    </CustomCard>

    <CustomCard title="节点颜色与自定义节点（#dot 插槽）">
      <u-timeline>
        <u-timeline-item color="primary">
          <template #dot>🚀</template>
          <b>流水线启动</b>：由定时任务 trigger-cron 触发
        </u-timeline-item>
        <u-timeline-item color="warning">
          <template #dot>⏳</template>
          <b>等待审批</b>：需运维负责人确认变更单 CHG-2031
        </u-timeline-item>
        <u-timeline-item color="success">
          <template #dot>✅</template>
          <b>审批通过</b>：进入发布队列
        </u-timeline-item>
        <u-timeline-item color="danger">
          <b>发布失败</b>：健康检查 3 次超时，已自动回滚到 v2.3.9
        </u-timeline-item>
      </u-timeline>

      <p class="timeline-demo__tip">
        color 支持 primary / success / warning / danger；#dot 插槽可替换圆点为任意节点。
      </p>
    </CustomCard>

    <CustomCard title="时间戳位置（timestamp-placement=top）">
      <u-timeline>
        <u-timeline-item timestamp="2026-09-28 10:00" timestamp-placement="top" color="primary">
          需求评审通过，进入排期
        </u-timeline-item>
        <u-timeline-item timestamp="2026-09-30 18:30" timestamp-placement="top">
          开发完成，提交冒烟测试
        </u-timeline-item>
        <u-timeline-item timestamp="2026-10-03 09:00" timestamp-placement="top" color="success">
          测试通过，合入 dev 分支
        </u-timeline-item>
      </u-timeline>

      <p class="timeline-demo__tip">timestamp-placement 默认 bottom，传 top 时时间戳在内容上方。</p>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import CustomCard from '../card/custom-card.vue'
</script>

<style scoped>
.timeline-demo__tip {
  margin: 8px 0 0;
  font-size: 13px;
}
</style>
