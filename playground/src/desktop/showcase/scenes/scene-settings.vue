<template>
  <div class="scene-settings">
    <u-card class="form-card">
      <u-card-header>
        <div class="row-between w-full">
          <div>
            <h3 class="section-title">工作区系统配置</h3>
            <p class="section-desc">完整展示表单校验、各类输入控件与实时配置预览</p>
          </div>
          <div class="row gap-xs">
            <u-pop-confirm title="确认将所有配置恢复为默认值吗？" @confirm="resetForm">
              <template #reference>
                <u-button plain>恢复默认</u-button>
              </template>
            </u-pop-confirm>
            <u-button type="primary" @click="submitForm">保存配置</u-button>
          </div>
        </div>
      </u-card-header>

      <u-card-content>
        <u-form ref="formRef" :model="form" label-width="110px">
          <u-input
            label="工作区名称"
            field="workspaceName"
            :rules="{ required: true, minLen: [2, '至少 2 个字符'] }"
            placeholder="请输入工作区名称"
          />

          <u-auto-complete
            label="默认地区"
            field="region"
            :suggestions="regionSuggestions"
            placeholder="选择或输入部署节点"
          />

          <u-select
            label="运行环境"
            field="env"
            :options="envOptions"
            :rules="{ required: true }"
          />

          <u-number-input label="并发上限" field="concurrency" :min="1" :max="64" :step="1" />

          <u-form-item label="部署密钥" field="apiKey" :rules="{ required: true, minLen: 6 }">
            <u-password-input v-model="form.apiKey" placeholder="请输入至少 6 位密钥" />
          </u-form-item>

          <u-date-picker label="生效日期" field="effectiveDate" />

          <u-radio-group label="计费模式" field="billingMode" :items="billingOptions" />

          <u-chip-group label="日志保留" field="logRetention" :items="retentionOptions" />

          <u-slider label="缓存比例" field="cacheRatio" :min="10" :max="90" />

          <u-switch label="开启审计日志" field="auditEnabled" active-text="开" inactive-text="关" />

          <u-textarea
            label="备注说明"
            field="remark"
            span="full"
            :rows="3"
            placeholder="填写团队或环境说明..."
          />
        </u-form>
      </u-card-content>
    </u-card>

    <!-- 右侧实时预览 -->
    <div class="preview-col">
      <u-card>
        <u-card-header>
          <span class="section-title">实时配置摘要</span>
        </u-card-header>
        <u-card-content class="column gap-md">
          <u-descriptions :column="1" border>
            <u-descriptions-item label="工作区">{{ form.workspaceName }}</u-descriptions-item>
            <u-descriptions-item label="部署节点">{{ form.region }}</u-descriptions-item>
            <u-descriptions-item label="运行环境">
              <u-tag type="primary" size="small">{{ form.env }}</u-tag>
            </u-descriptions-item>
            <u-descriptions-item label="并发上限">{{ form.concurrency }} 线程</u-descriptions-item>
            <u-descriptions-item label="审计状态">
              <u-tag :type="form.auditEnabled ? 'success' : 'info'" size="small">
                {{ form.auditEnabled ? '已开启' : '未开启' }}
              </u-tag>
            </u-descriptions-item>
          </u-descriptions>

          <u-alert
            type="warning"
            title="修改并发上限与部署节点将在下一次滚动发布时生效。"
            show-icon
            :closable="false"
          />
        </u-card-content>
      </u-card>

      <u-card>
        <u-card-header>
          <span class="section-title">导出 JSON 预览</span>
        </u-card-header>
        <u-card-content>
          <u-code-editor
            :model-value="jsonPreview"
            lang="json"
            :langs="['json']"
            readonly
            :default-lines="9"
          />
        </u-card-content>
      </u-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import {
  UAlert,
  UAutoComplete,
  UButton,
  UCard,
  UCardContent,
  UCardHeader,
  UChipGroup,
  UCodeEditor,
  UDatePicker,
  UDescriptions,
  UDescriptionsItem,
  UForm,
  UFormItem,
  UInput,
  UNumberInput,
  UPasswordInput,
  UPopConfirm,
  URadioGroup,
  USelect,
  USlider,
  USwitch,
  UTag,
  UTextarea,
  message,
  notification
} from '@veltra/desktop'
import { computed, reactive, useTemplateRef } from 'vue'

const formRef = useTemplateRef<FormExposed>('formRef')

const initialValues = {
  workspaceName: 'Veltra Enterprise',
  region: 'cn-hangzhou',
  env: 'production',
  concurrency: 16,
  apiKey: 'veltra-secret-2026',
  effectiveDate: new Date(),
  billingMode: 'annual',
  logRetention: '30d',
  cacheRatio: 65,
  auditEnabled: true,
  remark: '用于核心桌面端产品线统一构建与预览。'
}

const form = reactive({ ...initialValues })

const regionSuggestions = ['cn-hangzhou', 'cn-shanghai', 'ap-singapore']

const envOptions = [
  { label: '生产环境 (Production)', value: 'production' },
  { label: '预发环境 (Staging)', value: 'staging' },
  { label: '测试环境 (Testing)', value: 'testing' }
]

const billingOptions = [
  { label: '按年订阅', value: 'annual' },
  { label: '按量计费', value: 'payg' }
]

const retentionOptions = [
  { label: '7 天', value: '7d' },
  { label: '30 天', value: '30d' },
  { label: '90 天', value: '90d' }
]

const jsonPreview = computed(() =>
  JSON.stringify(
    {
      workspaceName: form.workspaceName,
      region: form.region,
      env: form.env,
      concurrency: form.concurrency,
      billingMode: form.billingMode,
      logRetention: form.logRetention,
      cacheRatio: form.cacheRatio,
      auditEnabled: form.auditEnabled
    },
    null,
    2
  )
)

const submitForm = async () => {
  const valid = await formRef.value?.validate()
  if (valid) {
    notification.success({
      title: '配置已保存',
      content: `工作区「${form.workspaceName}」配置已同步生效。`
    })
  } else {
    message.warning('请先修正表单中的校验提示')
  }
}

const resetForm = () => {
  Object.assign(form, initialValues)
  message.info('已恢复默认配置')
}
</script>

<style scoped>
.scene-settings {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 1024px) {
  .scene-settings {
    grid-template-columns: 1.4fr 1fr;
  }
}

.preview-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--u-text-color-title);
}

.section-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
