<template>
  <div>
    <CustomCard title="基础使用">
      <div>开关状态: {{ basicSwitch }}</div>
      <u-switch v-model="basicSwitch" />
    </CustomCard>

    <CustomCard title="带文字描述">
      <div>开关状态: {{ textSwitch }}</div>
      <u-switch v-model="textSwitch" show-text active-text="开启" inactive-text="关闭" />
    </CustomCard>

    <CustomCard title="不同尺寸">
      <div style="display: flex; gap: 16px; align-items: center">
        <u-switch v-model="basicSwitch" size="small" />
        <u-switch v-model="basicSwitch" size="default" />
        <u-switch v-model="basicSwitch" size="large" />
      </div>
    </CustomCard>

    <CustomCard title="禁用状态">
      <div style="display: flex; gap: 16px; align-items: center">
        <u-switch v-model="basicSwitch" disabled />
        <u-switch v-model="trueSwitch" disabled />
      </div>
    </CustomCard>

    <CustomCard title="只读状态">
      <div style="display: flex; gap: 16px; align-items: center">
        <u-switch v-model="basicSwitch" readonly />
        <u-switch v-model="trueSwitch" readonly />
      </div>
    </CustomCard>

    <CustomCard title="在表单中使用">
      <u-form :model="formModel">
        <u-switch
          field="enabled"
          label="启用状态"
          show-text
          active-text="启用"
          inactive-text="禁用"
        />
        <u-switch field="notification" label="推送通知" />
      </u-form>
      <div style="margin-top: 16px">表单数据: {{ formModel.data }}</div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { FormModel } from '@veltra/desktop'
import { ref } from 'vue'

import CustomCard from '../card/custom-card.vue'

const basicSwitch = ref(false)
const textSwitch = ref(true)
const trueSwitch = ref(true)

const formModel = new FormModel({ enabled: { value: true }, notification: { value: false } })
</script>
