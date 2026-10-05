<template>
  <div class="demo">
    <section>
      <h3>基础表单（分组标题 + 行式列表）</h3>
      <UForm ref="formRef" :model="model" title="基本信息" @field:update="handleFieldUpdate">
        <UInput
          field="name"
          label="姓名"
          placeholder="请输入姓名"
          :rules="{ required: '请输入姓名' }"
        />
        <UInput
          field="phone"
          label="手机号"
          inputmode="numeric"
          :rules="{ required: true, preset: 'phone' }"
        />
        <UNumberInput field="age" label="年龄" :rules="{ min: [1, '年龄至少 1 岁'] }" />
        <USelect field="city" label="城市" :options="cities" :rules="{ required: true }" />
        <UMultiSelect field="tags" label="兴趣标签" :options="tags" :rules="{ required: true }" />
        <UCheckboxGroup
          field="channels"
          label="通知渠道"
          :items="channels"
          :rules="{ required: true }"
        />
        <URadioGroup field="gender" label="性别" :items="genders" />
        <USwitch field="notify" label="推送通知" />
        <UTextarea
          field="remark"
          label="备注"
          label-position="top"
          placeholder="选填"
          :rules="{ maxLen: [30, '备注最多 30 字'] }"
        />
      </UForm>

      <div class="actions">
        <UButton type="primary" @click="handleSubmit">提交校验</UButton>
        <UButton @click="handleReset">重置</UButton>
        <UButton text @click="handleClear">清除校验</UButton>
      </div>
      <p class="tip">校验结果：{{ validateResult }}</p>
      <p class="tip">最近字段更新：{{ lastUpdate }}</p>
    </section>

    <section>
      <h3>label 位置与宽度</h3>
      <UForm :model="leftModel" :label-width="88">
        <UInput field="account" label="账号" :rules="{ required: true }" />
        <USelect field="role" label="角色" :options="roles" />
      </UForm>
      <p class="tip">
        移动端默认行式（label 左、控件右、行高 48px、行间细分隔线）；传 label-width 后各行 label
        固定宽对齐；长控件建议单项或表单整体 label-position="top"
      </p>
    </section>

    <section>
      <h3>变更前对比（show-modified）</h3>
      <UForm :model="modifiedModel" :initial-model="modifiedBaseline" show-modified>
        <UInput field="title" label="标题" />
        <UMultiSelect field="scope" label="范围" :options="tags" />
      </UForm>
      <p class="tip">修改字段值后，控件下方出现「变更前」信息行</p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { FormExposed } from '@veltra/mobile'
import {
  UButton,
  UCheckboxGroup,
  UForm,
  UInput,
  UMultiSelect,
  UNumberInput,
  URadioGroup,
  USelect,
  USwitch,
  UTextarea
} from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/textarea/style'
import '@veltra/mobile/components/number-input/style'
import '@veltra/mobile/components/select/style'
import '@veltra/mobile/components/multi-select/style'
import '@veltra/mobile/components/checkbox-group/style'
import '@veltra/mobile/components/radio-group/style'
import '@veltra/mobile/components/switch/style'

const formRef = shallowRef<FormExposed>()

const model = reactive({
  name: '',
  phone: '',
  age: undefined as number | undefined,
  city: undefined as string | undefined,
  tags: [] as string[],
  channels: [] as string[],
  gender: 'male',
  notify: true,
  remark: ''
})

const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '深圳', value: 'shenzhen' }
]

const tags = [
  { label: '前端', value: 'fe' },
  { label: '后端', value: 'be' },
  { label: '设计', value: 'design' }
]

const channels = [
  { label: '短信', value: 'sms' },
  { label: '邮件', value: 'email' },
  { label: '站内信', value: 'inbox' }
]

const genders = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]

const roles = [
  { label: '管理员', value: 'admin' },
  { label: '成员', value: 'member' }
]

const validateResult = shallowRef('未校验')
const lastUpdate = shallowRef('-')

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  validateResult.value = valid ? '通过' : '未通过'
}

function handleReset() {
  formRef.value?.reset()
  validateResult.value = '未校验'
}

function handleClear() {
  formRef.value?.clearValidate()
}

function handleFieldUpdate(field: string, value: unknown) {
  lastUpdate.value = `${field}: ${Array.isArray(value) ? value.join('、') : String(value)}`
}

const leftModel = reactive({ account: '', role: undefined as string | undefined })

const modifiedModel = reactive({ title: '原标题', scope: ['fe'] as string[] })
const modifiedBaseline = { title: '原标题', scope: ['fe'] }
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度与触控热区
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

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.tip {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
