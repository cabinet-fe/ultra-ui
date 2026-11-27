<template>
  <div class="scene-overview">
    <!-- KPI 指标行 -->
    <div class="kpi-grid">
      <u-card class="kpi-card">
        <u-card-content>
          <div class="kpi-top">
            <span class="kpi-label">活跃用户</span>
            <u-tag type="success" size="small">+12.5%</u-tag>
          </div>
          <div class="kpi-value">
            <u-number :value="28490" tween />
          </div>
          <div class="kpi-sub">较上周新增 3,164 位开发者</div>
        </u-card-content>
      </u-card>

      <u-card class="kpi-card">
        <u-card-content>
          <div class="kpi-top">
            <span class="kpi-label">本月营收</span>
            <u-tag type="primary" size="small">目标 86%</u-tag>
          </div>
          <div class="kpi-value">
            <u-number :value="148620" format="currency" tween />
          </div>
          <u-progress :percentage="86" type="primary" class="mt-2" />
        </u-card-content>
      </u-card>

      <u-card class="kpi-card">
        <u-card-content>
          <div class="kpi-top">
            <span class="kpi-label">迭代交付率</span>
            <u-tag type="warning" size="small">Sprint 14</u-tag>
          </div>
          <div class="kpi-value">
            <u-number :value="0.942" format="percent" :precision="1" tween />
          </div>
          <div class="kpi-sub row-inline">
            <span>团队评分</span>
            <u-rate :model-value="4.5" allow-half readonly />
          </div>
        </u-card-content>
      </u-card>

      <u-card class="kpi-card">
        <u-card-content>
          <div class="kpi-top">
            <span class="kpi-label">集群状态</span>
            <u-badge dot type="success">
              <span class="status-text">运行正常</span>
            </u-badge>
          </div>
          <div class="kpi-value">99.98%</div>
          <div class="kpi-sub row-between">
            <span>自动弹性扩容</span>
            <u-switch v-model="autoScale" size="small" />
          </div>
        </u-card-content>
      </u-card>
    </div>

    <!-- Bento 网格 -->
    <div class="bento-grid">
      <!-- 订阅与支付 -->
      <u-card class="bento-card">
        <u-card-header>
          <div class="card-title-group">
            <h3>订阅与结算</h3>
            <p>快速更新企业账单与支付方式</p>
          </div>
        </u-card-header>
        <u-card-content class="column gap-md flex-1">
          <u-chip-group v-model="payMethod" :items="payMethods" />

          <div class="column gap-xs">
            <label class="field-label">持卡人姓名</label>
            <u-input v-model="cardHolder" placeholder="请输入持卡人姓名" />
          </div>

          <div class="column gap-xs">
            <label class="field-label">银行卡号</label>
            <u-input v-model="cardNumber" placeholder="0000 0000 0000 0000">
              <template #prefix>
                <u-icon><CreditCard /></u-icon>
              </template>
            </u-input>
          </div>

          <div class="row gap-md">
            <div class="column gap-xs flex-1">
              <label class="field-label">有效期（月）</label>
              <u-select v-model="month" :options="months" placeholder="月份" />
            </div>
            <div class="column gap-xs flex-1">
              <label class="field-label">年份</label>
              <u-select v-model="year" :options="years" placeholder="年份" />
            </div>
          </div>

          <u-button type="primary" class="w-full mt-auto" @click="onPayConfirm">
            确认并保存
          </u-button>
        </u-card-content>
      </u-card>

      <!-- 通知与声音控制 -->
      <u-card class="bento-card">
        <u-card-header>
          <div class="card-title-group">
            <h3>通知中心</h3>
            <p>管理实时推送与提醒偏好</p>
          </div>
        </u-card-header>
        <u-card-content class="column gap-lg flex-1">
          <div class="list-item">
            <div class="icon-badge primary">
              <u-icon><Bell /></u-icon>
            </div>
            <div class="list-item-text">
              <h4>桌面推送通知</h4>
              <p>有新评论或部署完成时立即提醒</p>
            </div>
            <u-switch v-model="notifyPush" />
          </div>

          <div class="list-item">
            <div class="icon-badge warning">
              <u-icon><User /></u-icon>
            </div>
            <div class="list-item-text">
              <h4>@提及提醒</h4>
              <p>仅在团队成员直接提及我时通知</p>
            </div>
            <u-switch v-model="notifyMention" />
          </div>

          <u-divider />

          <div class="column gap-xs">
            <div class="row-between">
              <span class="field-label">提示音量</span>
              <span class="text-xs text-second">{{ volume }}%</span>
            </div>
            <u-slider v-model="volume" />
          </div>

          <div class="row-between mt-auto">
            <u-checkbox v-model="systemSound">启用系统提示音</u-checkbox>
            <u-tip content="3 条未读系统通知" direction="top">
              <u-badge :value="3" type="danger">
                <u-button circle plain>
                  <u-icon><Bell /></u-icon>
                </u-button>
              </u-badge>
            </u-tip>
          </div>
        </u-card-content>
      </u-card>

      <!-- 云端存储与日程 -->
      <u-card class="bento-card">
        <u-card-header>
          <div class="card-title-group">
            <h3>日程与存储</h3>
            <p>今日会议安排及空间用量</p>
          </div>
        </u-card-header>
        <u-card-content class="column gap-md flex-1">
          <u-date-picker v-model="scheduleDate" type="date" style="width: 100%" />

          <u-timeline class="mt-2">
            <u-timeline-item color="primary" timestamp="09:30 - 10:30">
              <span class="text-sm font-medium">设计系统走查评审</span>
            </u-timeline-item>
            <u-timeline-item color="warning" timestamp="14:00 - 15:30">
              <span class="text-sm font-medium">Veltra 2.0 发布准备会</span>
            </u-timeline-item>
          </u-timeline>

          <u-divider />

          <div class="column gap-xs mt-auto">
            <div class="row-between">
              <span class="field-label">云盘空间</span>
              <span class="text-xs text-second">86.5 / 100 GB</span>
            </div>
            <u-progress :percentage="86.5" type="primary" />
          </div>
        </u-card-content>
      </u-card>

      <!-- 团队协作 -->
      <u-card class="bento-card col-span-2">
        <u-card-header>
          <div class="row-between w-full">
            <div class="card-title-group">
              <h3>团队成员与共享</h3>
              <p>管理项目权限并生成协作邀请链接</p>
            </div>
            <u-avatar-group :max="3">
              <u-avatar>林</u-avatar>
              <u-avatar>陈</u-avatar>
              <u-avatar>周</u-avatar>
              <u-avatar>吴</u-avatar>
            </u-avatar-group>
          </div>
        </u-card-header>
        <u-card-content class="column gap-md flex-1">
          <div class="list-item space-between">
            <div class="row gap-md">
              <u-avatar>林</u-avatar>
              <div class="list-item-text">
                <h4>林知夏</h4>
                <p>linzhixia@veltra.dev</p>
              </div>
            </div>
            <u-select v-model="role1" :options="roleOptions" style="width: 130px" />
          </div>

          <div class="list-item space-between">
            <div class="row gap-md">
              <u-avatar>陈</u-avatar>
              <div class="list-item-text">
                <h4>陈默</h4>
                <p>chenmo@veltra.dev</p>
              </div>
            </div>
            <u-select v-model="role2" :options="roleOptions" style="width: 130px" />
          </div>

          <u-divider />

          <div class="column gap-xs mt-auto">
            <span class="field-label">项目共享链接</span>
            <div class="row gap-md">
              <u-input
                model-value="https://veltra.dev/workspace/ultra-ui"
                class="flex-1"
                readonly
              />
              <u-button type="primary" @click="onCopyLink">
                <u-icon><Copy /></u-icon> 复制链接
              </u-button>
            </div>
          </div>
        </u-card-content>
      </u-card>

      <!-- 项目工作流 -->
      <u-card class="bento-card">
        <u-card-header>
          <div class="card-title-group">
            <h3>项目里程碑</h3>
            <p>跟踪阶段进度与子任务详情</p>
          </div>
        </u-card-header>
        <u-card-content class="column gap-md flex-1">
          <u-steps
            :items="[
              { label: '需求规划' },
              { label: '研发实现' },
              { label: '联调测试' },
              { label: '正式上线' }
            ]"
            :current="1"
            size="small"
          />

          <u-tabs
            v-model="tabActive"
            :items="[
              { key: 'tasks', name: '待办拆解' },
              { key: 'files', name: '交付物' }
            ]"
            class="flex-1"
          >
            <template #tasks>
              <u-collapse v-model="collapseActive" class="mt-2">
                <u-collapse-item title="组件样式 Token 统一" value="1">
                  <p class="text-xs text-second m-0">已完成全部基础组件暗色模式与圆角变量适配。</p>
                </u-collapse-item>
                <u-collapse-item title="自动化回归测试" value="2">
                  <p class="text-xs text-second m-0">覆盖桌面端 60+ 组件交互与无障碍用例。</p>
                </u-collapse-item>
              </u-collapse>
            </template>
            <template #files>
              <div class="flex-center" style="height: 120px">
                <u-empty text="暂无归档交付物" />
              </div>
            </template>
          </u-tabs>
        </u-card-content>
      </u-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UAvatar,
  UAvatarGroup,
  UBadge,
  UButton,
  UCard,
  UCardContent,
  UCardHeader,
  UCheckbox,
  UChipGroup,
  UCollapse,
  UCollapseItem,
  UDatePicker,
  UDivider,
  UEmpty,
  UIcon,
  UInput,
  UNumber,
  UProgress,
  URate,
  USelect,
  USlider,
  USteps,
  USwitch,
  UTabs,
  UTag,
  UTimeline,
  UTimelineItem,
  UTip,
  message
} from '@veltra/desktop'
import { Bell, Copy, CreditCard, User } from '@veltra/icons/normal'
import { ref, shallowRef } from 'vue'

const autoScale = ref(true)
const payMethod = ref('card')
const payMethods = [
  { label: '企业信用卡', value: 'card' },
  { label: '对公钱包', value: 'wallet' },
  { label: '月结账单', value: 'invoice' }
]
const cardHolder = ref('Lin Zhixia')
const cardNumber = ref('4242 •••• •••• 8842')
const month = ref('08')
const year = ref('2028')
const months = [
  { label: '06 月', value: '06' },
  { label: '08 月', value: '08' },
  { label: '10 月', value: '10' },
  { label: '12 月', value: '12' }
]
const years = [
  { label: '2027', value: '2027' },
  { label: '2028', value: '2028' },
  { label: '2029', value: '2029' }
]

const notifyPush = ref(true)
const notifyMention = ref(false)
const volume = ref(72)
const systemSound = ref(true)

const scheduleDate = shallowRef(new Date())

const role1 = ref('owner')
const role2 = ref('admin')
const roleOptions = [
  { label: '负责人', value: 'owner' },
  { label: '管理员', value: 'admin' },
  { label: '成员', value: 'member' }
]

const tabActive = ref('tasks')
const collapseActive = ref('1')

const onPayConfirm = () => {
  message.success('支付方式已更新')
}

const onCopyLink = () => {
  message.success('邀请链接已复制到剪贴板')
}
</script>

<style scoped>
.scene-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.kpi-label {
  font-size: 13px;
  color: var(--u-text-color-second);
  font-weight: 500;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--u-text-color-title);
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.kpi-sub {
  margin-top: 8px;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.status-text {
  font-size: 12px;
  color: var(--u-color-success);
  padding-right: 8px;
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 20px;
}

@media (min-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1100px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .col-span-2 {
    grid-column: span 2;
  }
}

.bento-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-title-group h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--u-text-color-title);
}

.card-title-group p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.row-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.space-between {
  justify-content: space-between;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-item-text {
  flex: 1;
}

.list-item-text h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-title);
}

.list-item-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.icon-badge {
  width: 38px;
  height: 38px;
  border-radius: var(--u-radius-default);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.icon-badge.primary {
  background: var(--u-color-primary-light-9);
  color: var(--u-color-primary);
}

.icon-badge.warning {
  background: var(--u-color-warning-light-9);
  color: var(--u-color-warning);
}
</style>
