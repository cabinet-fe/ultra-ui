<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <UFormItem label="用户名">
        <UInput v-model="username" placeholder="请输入用户名" />
      </UFormItem>
      <p class="tip">UFormItem 可脱离 UForm 单独使用，仅负责标签与布局</p>
    </section>

    <section>
      <h3>必填与校验提示</h3>
      <UForm ref="formRef" :model="model">
        <UFormItem label="邮箱" field="email" :rules="{ required: true, preset: 'email' }">
          <UInput v-model="model.email" placeholder="请输入邮箱" />
        </UFormItem>
        <UFormItem
          label="密码"
          field="password"
          :rules="{ required: '请输入密码', minLen: [6, '密码至少 6 位'] }"
        >
          <UPasswordInput v-model="model.password" placeholder="请输入密码" />
        </UFormItem>
      </UForm>
      <div class="actions">
        <UButton type="primary" @click="handleValidate">校验</UButton>
        <UButton text @click="handleClear">清除校验</UButton>
      </div>
      <p class="tip">校验结果：{{ validateResult }}；带 rules 的必填项标签前出现 * 号</p>
    </section>

    <section>
      <h3>change 事件</h3>
      <UFormItem label="城市" @change="changeCount++">
        <USelect v-model="city" :options="cities" />
      </UFormItem>
      <p class="tip">内部控件 change 已触发 {{ changeCount }} 次</p>
    </section>

    <section>
      <h3>标签位置与插槽</h3>
      <UFormItem label="备注" label-position="left" :label-width="72">
        <UTextarea v-model="remark" placeholder="label 在左侧" />
      </UFormItem>
      <UFormItem>
        <template #label>自定义标签</template>
        <UInput v-model="custom" placeholder="label 走插槽" />
      </UFormItem>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { FormExposed } from '@veltra/mobile'
import {
  UButton,
  UForm,
  UFormItem,
  UInput,
  UPasswordInput,
  USelect,
  UTextarea
} from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/password-input/style'
import '@veltra/mobile/components/select/style'
import '@veltra/mobile/components/textarea/style'

const formRef = shallowRef<FormExposed>()

const username = shallowRef('')

const model = reactive({ email: '', password: '' })

const validateResult = shallowRef('未校验')

async function handleValidate() {
  const valid = await formRef.value?.validate()
  validateResult.value = valid ? '通过' : '未通过'
}

function handleClear() {
  formRef.value?.clearValidate()
  validateResult.value = '未校验'
}

const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' }
]

const city = shallowRef<string>()
const changeCount = shallowRef(0)
const remark = shallowRef('')
const custom = shallowRef('')
</script>

<style lang="scss" scoped>
// 375px 手机视口宽度内呈现，验证移动端密度与触控热区
.demo {
  max-width: 375px;
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
