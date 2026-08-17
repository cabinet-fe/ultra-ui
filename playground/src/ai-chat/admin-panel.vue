<template>
  <div class="admin-panel">
    <!-- 工具执行中：模拟后台页面加载 -->
    <div v-if="loading" class="admin-panel__loading">页面打开中…</div>

    <!-- 用户编辑表单 -->
    <template v-else-if="page === 'user-form'">
      <u-form ref="formRef" :model="userForm" label-width="72px">
        <u-input label="姓名" field="name" :rules="{ required: true }" placeholder="请输入姓名" />
        <u-form-item label="角色" field="role">
          <u-select v-model="userForm.role" :options="roleOptions" />
        </u-form-item>
        <u-form-item label="年龄" field="age">
          <u-number-input v-model="userForm.age" :min="1" :max="120" />
        </u-form-item>
        <u-form-item label="备注" field="remark">
          <u-textarea v-model="userForm.remark" :rows="3" placeholder="选填" />
        </u-form-item>
      </u-form>
      <div class="admin-panel__actions">
        <u-button type="primary" @click="submitForm">保存</u-button>
        <u-button text @click="resetForm">重置</u-button>
      </div>
    </template>

    <!-- 销售图表（纯 CSS 柱状图，组件体系内无三方图表库） -->
    <template v-else-if="page === 'sales-chart'">
      <div class="admin-panel__chart-title">月度销售额（万元）</div>
      <div class="admin-chart">
        <div v-for="item in sales" :key="item.month" class="admin-chart__col">
          <div class="admin-chart__bar" :style="{ height: `${(item.value / maxSale) * 100}%` }">
            <span class="admin-chart__value">{{ item.value }}</span>
          </div>
          <span class="admin-chart__label">{{ item.month }}</span>
        </div>
      </div>
    </template>

    <!-- 订单列表 -->
    <template v-else-if="page === 'order-list'">
      <u-table :data="orders" :columns="orderColumns" style="height: 460px" />
    </template>

    <u-empty v-else description="未知页面" />
  </div>
</template>

<script lang="ts" setup>
import type { ChatToolRenderProps } from '@veltra/ai'
import { defineTableColumns, message, type FormExposed } from '@veltra/desktop'
import { computed, reactive, useTemplateRef } from 'vue'

/**
 * 后台系统页面面板：openAdminPage 工具的 renderTo: 'panel' 渲染组件。
 * 按工具参数中的 page 展示对应后台页面，可直接在面板中操作（表单/图表/列表）。
 */
const props = defineProps<ChatToolRenderProps>()

const page = computed(() => {
  try {
    return JSON.parse(props.toolCall.arguments || '{}').page as string | undefined
  } catch {
    return undefined
  }
})

/** 工具执行完成前展示加载态（result 就绪即页面就绪） */
const loading = computed(() => props.toolCall.status !== 'success')

// ---------------- 用户编辑表单 ----------------
const formRef = useTemplateRef<FormExposed>('formRef')

const initialForm = { name: '张三', role: 'admin', age: 28, remark: '' }
const userForm = reactive({ ...initialForm })

const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '运营', value: 'ops' },
  { label: '访客', value: 'guest' }
]

const submitForm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  message.success(`用户「${userForm.name}」已保存`)
}

const resetForm = () => Object.assign(userForm, initialForm)

// ---------------- 销售图表 ----------------
const sales = [
  { month: '1月', value: 42 },
  { month: '2月', value: 35 },
  { month: '3月', value: 58 },
  { month: '4月', value: 47 },
  { month: '5月', value: 66 },
  { month: '6月', value: 80 },
  { month: '7月', value: 72 },
  { month: '8月', value: 91 },
  { month: '9月', value: 63 },
  { month: '10月', value: 77 },
  { month: '11月', value: 85 },
  { month: '12月', value: 98 }
]

const maxSale = computed(() => Math.max(...sales.map((item) => item.value)))

// ---------------- 订单列表 ----------------
const orders = Array.from({ length: 30 }).map((_, i) => ({
  id: `SO-2026${String(i + 1).padStart(3, '0')}`,
  customer: ['张三', '李四', '王五'][i % 3]!,
  amount: ((i * 137) % 5000) + 200,
  status: ['待发货', '已发货', '已完成'][i % 3]!
}))

const orderColumns = defineTableColumns([
  { key: 'id', name: '订单号', width: 100 },
  { key: 'customer', name: '客户', align: 'center' },
  { key: 'amount', name: '金额（元）', align: 'right' },
  { key: 'status', name: '状态', align: 'center' }
])
</script>

<style scoped>
.admin-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

.admin-panel__loading {
  color: var(--u-text-color-second);
  font-size: 13px;
}

.admin-panel__chart-title {
  font-weight: 600;
  font-size: 14px;
}

.admin-panel__actions {
  display: flex;
  gap: 8px;
}

.admin-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 280px;
  padding: 22px 4px 0;
  box-sizing: border-box;
  border-bottom: 1px solid var(--u-border-muted-color);
}

.admin-chart__col {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.admin-chart__bar {
  position: relative;
  width: 100%;
  max-width: 32px;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  background-color: var(--u-color-primary);
}

.admin-chart__value {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--u-text-color-second);
  white-space: nowrap;
}

.admin-chart__label {
  font-size: 11px;
  color: var(--u-text-color-second);
  white-space: nowrap;
}
</style>
