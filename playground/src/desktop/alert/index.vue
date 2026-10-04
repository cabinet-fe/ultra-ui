<template>
  <div class="alert-demo">
    <CustomCard title="基本用法">
      <u-alert
        v-for="item of types"
        :key="item"
        :type="item"
        :title="titles[item]"
        description="行内提示条：常驻页面内，不会自动消失，也不会遮挡内容。"
        show-icon
      />
    </CustomCard>

    <CustomCard title="可关闭">
      <u-alert
        v-for="(item, index) of closableAlerts"
        :key="item.type"
        :type="item.type"
        :title="item.title"
        closable
        @close="handleClose(index)"
      />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import type { AlertType } from '@veltra/desktop'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const types: AlertType[] = ['info', 'success', 'warning', 'error']

const titles: Record<AlertType, string> = {
  info: '信息提示',
  success: '操作成功',
  warning: '注意警告',
  error: '错误提示'
}

const closableAlerts = shallowRef<Array<{ type: AlertType; title: string }>>([
  { type: 'info', title: '点击右侧图标关闭' },
  { type: 'warning', title: '关闭后由事件回调移除数据' }
])

/** 组件隐藏自身后，移除对应数据源 */
const handleClose = (index: number) => {
  closableAlerts.value = closableAlerts.value.filter((_, i) => i !== index)
}
</script>

<style lang="scss" scoped>
.alert-demo {
  :deep(.u-alert) {
    margin-bottom: 12px;
  }
}
</style>
