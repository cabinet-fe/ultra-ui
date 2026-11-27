<template>
  <div class="timeline-demo">
    <CustomCard title="发布流水线（基础用法与语义状态）">
      <u-timeline>
        <u-timeline-item timestamp="2026-10-24 09:12" color="success">
          <div class="timeline-demo__head">
            <span class="timeline-demo__title">代码合并与构建完成</span>
            <u-tag type="success" size="small">v2.4.0</u-tag>
          </div>
          <p class="timeline-demo__desc">PR #418 已合入 release 分支，产物通过体积与类型校验。</p>
        </u-timeline-item>

        <u-timeline-item timestamp="2026-10-24 10:05" color="primary">
          <div class="timeline-demo__head">
            <span class="timeline-demo__title">灰度发布中</span>
            <u-tag type="primary" size="small">25% 流量</u-tag>
          </div>
          <p class="timeline-demo__desc">核心接口延迟 P99 稳定在 42ms，暂无异常告警。</p>
        </u-timeline-item>

        <u-timeline-item timestamp="2026-10-24 10:28" color="warning">
          <div class="timeline-demo__head">
            <span class="timeline-demo__title">等待运维确认全量切换</span>
            <u-tag type="warning" size="small">审批中</u-tag>
          </div>
          <p class="timeline-demo__desc">变更单 CHG-2031 已推送至值班负责人。</p>
        </u-timeline-item>

        <u-timeline-item timestamp="2026-10-24 11:00">
          <div class="timeline-demo__head">
            <span class="timeline-demo__title">全量发布与健康观察</span>
          </div>
          <p class="timeline-demo__desc">未传 color 时呈现中性待办态，与后续节点自然区分。</p>
        </u-timeline-item>

        <u-timeline-item timestamp="2026-10-24 11:15" color="danger">
          <div class="timeline-demo__head">
            <span class="timeline-demo__title">压测异常模拟（回滚预案演练）</span>
            <u-tag type="danger" size="small">已阻断</u-tag>
          </div>
          <p class="timeline-demo__desc">触发熔断阈值，已自动切回上一稳定版本 v2.3.9。</p>
        </u-timeline-item>
      </u-timeline>
    </CustomCard>

    <CustomCard title="审批与事件流（#dot 自定义图标节点）">
      <u-timeline>
        <u-timeline-item timestamp="14:02 · 研发提交" color="primary">
          <template #dot>
            <u-icon><Build /></u-icon>
          </template>
          <span class="timeline-demo__title">提交生产发布申请</span>
          <p class="timeline-demo__desc">自定义 #dot 节点与尾线保持同心，自动继承 color 语义色。</p>
        </u-timeline-item>

        <u-timeline-item timestamp="14:18 · 安全复核" color="warning">
          <template #dot>
            <u-icon><WarningFilled /></u-icon>
          </template>
          <span class="timeline-demo__title">补充依赖许可证声明</span>
          <p class="timeline-demo__desc">新增 1 项依赖扫描提示，已附上合规确认记录。</p>
        </u-timeline-item>

        <u-timeline-item timestamp="14:45 · 变更审批" color="success">
          <template #dot>
            <u-icon><CircleCheckFilled /></u-icon>
          </template>
          <span class="timeline-demo__title">发布窗口审批通过</span>
          <p class="timeline-demo__desc">准许于今日 15:00 执行自动化发布脚本。</p>
        </u-timeline-item>

        <u-timeline-item timestamp="15:03 · 异常中止" color="danger">
          <template #dot>
            <u-icon><CircleClose /></u-icon>
          </template>
          <span class="timeline-demo__title">预检失败，取消本次发布</span>
          <p class="timeline-demo__desc">目标集群镜像拉取超时，请检查仓库连通性后重试。</p>
        </u-timeline-item>
      </u-timeline>
    </CustomCard>

    <CustomCard title='版本演进（timestamp-placement="top" + 卡片内容）'>
      <u-timeline>
        <u-timeline-item timestamp="2026-11-12" timestamp-placement="top" color="primary">
          <div class="timeline-demo__card">
            <div class="timeline-demo__head">
              <span class="timeline-demo__title">v2.5.0 · 交互与视觉打磨</span>
              <u-tag type="primary" size="small">最新</u-tag>
            </div>
            <p class="timeline-demo__desc">
              优化时间线节点光环与圆角尾线间距，支持自定义 #dot 图标沿用语义色彩。
            </p>
          </div>
        </u-timeline-item>

        <u-timeline-item timestamp="2026-10-28" timestamp-placement="top" color="success">
          <div class="timeline-demo__card">
            <div class="timeline-demo__head">
              <span class="timeline-demo__title">v2.4.0 · 主题系统升级</span>
            </div>
            <p class="timeline-demo__desc">
              统一桌面端与移动端透明光晕 token，暗色主题自动适配无需额外覆写。
            </p>
          </div>
        </u-timeline-item>

        <u-timeline-item timestamp="2026-10-09" timestamp-placement="top">
          <div class="timeline-demo__card">
            <div class="timeline-demo__head">
              <span class="timeline-demo__title">v2.3.0 · 基础设施重构</span>
            </div>
            <p class="timeline-demo__desc">完成组件按需样式入口拆分，构建体积进一步精简。</p>
          </div>
        </u-timeline-item>
      </u-timeline>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { UIcon, UTag, UTimeline, UTimelineItem } from '@veltra/desktop'
import { Build, CircleCheckFilled, CircleClose, WarningFilled } from '@veltra/icons/normal'

import CustomCard from '../card/custom-card.vue'
</script>

<style lang="scss" scoped>
.timeline-demo {
  max-width: 720px;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__title {
    font-weight: 600;
    color: var(--u-text-color-title);
  }

  &__desc {
    margin: 4px 0 0;
    color: var(--u-text-color-second);
    font-size: var(--u-font-size-assist-default);
  }

  &__card {
    padding: 12px 14px;
    background-color: var(--u-bg-color-middle);
    border: var(--u-border);
    border-radius: var(--u-radius-default);
  }
}
</style>
