<template>
  <div class="demo">
    <section>
      <h3>基础用法（节点、时间戳、内容）</h3>
      <UTimeline>
        <UTimelineItem timestamp="2026-10-01 09:30" color="primary">
          创建部署任务：frontend / release-v2.4.0
        </UTimelineItem>
        <UTimelineItem timestamp="2026-10-02 14:12"> 构建产物上传完成，共 36 个文件 </UTimelineItem>
        <UTimelineItem timestamp="2026-10-03 20:05" color="success">
          灰度环境验收通过，全量发布开始
        </UTimelineItem>
        <UTimelineItem timestamp="2026-10-04 08:00" color="success">
          发布完成，线上版本 v2.4.0
        </UTimelineItem>
      </UTimeline>

      <p class="tip">不传 color 时为中性色节点；最后一个节点不渲染尾线。</p>
    </section>

    <section>
      <h3>节点颜色与自定义节点（#dot 插槽）</h3>
      <UTimeline>
        <UTimelineItem color="primary">
          <template #dot>🚀</template>
          <b>流水线启动</b>：由定时任务 trigger-cron 触发
        </UTimelineItem>
        <UTimelineItem color="warning">
          <template #dot>⏳</template>
          <b>等待审批</b>：需运维负责人确认变更单 CHG-2031
        </UTimelineItem>
        <UTimelineItem color="success">
          <template #dot>✅</template>
          <b>审批通过</b>：进入发布队列
        </UTimelineItem>
        <UTimelineItem color="danger">
          <b>发布失败</b>：健康检查 3 次超时，已自动回滚到 v2.3.9
        </UTimelineItem>
      </UTimeline>
    </section>

    <section>
      <h3>时间戳位置（timestamp-placement=top）</h3>
      <UTimeline>
        <UTimelineItem timestamp="2026-09-28 10:00" timestamp-placement="top" color="primary">
          需求评审通过，进入排期
        </UTimelineItem>
        <UTimelineItem timestamp="2026-09-30 18:30" timestamp-placement="top">
          开发完成，提交冒烟测试
        </UTimelineItem>
        <UTimelineItem timestamp="2026-10-03 09:00" timestamp-placement="top" color="success">
          测试通过，合入 dev 分支
        </UTimelineItem>
      </UTimeline>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UTimeline, UTimelineItem } from '@veltra/mobile'
import '@veltra/mobile/components/timeline/style'
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度
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
