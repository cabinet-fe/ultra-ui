<template>
  <div class="scene-data">
    <!-- 筛选工具栏 -->
    <u-card>
      <u-card-content class="filter-bar">
        <u-input
          v-model="keyword"
          placeholder="搜索服务名称或负责人..."
          clearable
          style="width: 240px"
        >
          <template #prefix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>

        <u-select
          v-model="dept"
          :options="deptOptions"
          placeholder="所属部门"
          clearable
          style="width: 160px"
        />

        <u-date-range-picker v-model="dateRange" style="width: 260px" />

        <div class="row gap-xs">
          <u-check-tag
            v-for="item in statusFilters"
            :key="item.value"
            :checked="statusFilter === item.value"
            @update:model-value="statusFilter = item.value"
          >
            {{ item.label }}
          </u-check-tag>
        </div>

        <u-button class="ml-auto" plain @click="resetFilters">重置筛选</u-button>
      </u-card-content>
    </u-card>

    <!-- 主体：表格 + 树目录 -->
    <div class="data-layout">
      <u-card class="table-card">
        <u-card-header>
          <div class="row-between w-full">
            <span class="section-title">数据资产列表</span>
            <span class="text-xs text-second">共 {{ filteredRows.length }} 条记录</span>
          </div>
        </u-card-header>
        <u-card-content class="column gap-md">
          <u-table :data="pagedRows" :columns="columns" checkable show-index row-key="id">
            <template #column:name="{ rowData }">
              <div class="column">
                <span class="font-medium">{{ rowData.name }}</span>
                <span class="text-xs text-second">{{ rowData.id }}</span>
              </div>
            </template>

            <template #column:owner="{ rowData }">
              <div class="row gap-xs">
                <u-avatar size="small">{{ rowData.owner.slice(0, 1) }}</u-avatar>
                <span>{{ rowData.owner }}</span>
              </div>
            </template>

            <template #column:status="{ rowData }">
              <u-tag :type="statusTagMap[rowData.status]?.type ?? 'info'" size="small">
                {{ statusTagMap[rowData.status]?.label ?? rowData.status }}
              </u-tag>
            </template>

            <template #column:health="{ rowData }">
              <u-progress
                :percentage="rowData.health"
                :type="rowData.health >= 80 ? 'success' : 'warning'"
              />
            </template>

            <template #column:rating="{ rowData }">
              <u-rate :model-value="rowData.rating" readonly />
            </template>

            <template #column:actions="{ rowData }">
              <u-action-group>
                <u-action @run="openDetail(rowData as AssetRow)">详情</u-action>
                <u-action type="danger" need-confirm @run="archiveRow(rowData as AssetRow)">
                  归档
                </u-action>
              </u-action-group>
            </template>
          </u-table>

          <div class="row-between mt-2">
            <span class="text-xs text-second">第 {{ page }} 页 · 每页 {{ pageSize }} 条</span>
            <u-paginator
              v-model:page-number="page"
              :total="filteredRows.length"
              :page-size="pageSize"
              size="small"
            />
          </div>
        </u-card-content>
      </u-card>

      <u-card class="tree-card">
        <u-card-header>
          <span class="section-title">资产目录树</span>
        </u-card-header>
        <u-card-content>
          <u-tree :data="assetTree" label-key="name" value-key="id" expand-all checkable />
        </u-card-content>
      </u-card>
    </div>

    <!-- 详情抽屉 -->
    <u-drawer v-model="drawerVisible" title="资产详情预览" size="460px">
      <div v-if="activeRow" class="drawer-body">
        <u-descriptions :column="1" border>
          <u-descriptions-item label="资产编号">{{ activeRow.id }}</u-descriptions-item>
          <u-descriptions-item label="服务名称">{{ activeRow.name }}</u-descriptions-item>
          <u-descriptions-item label="所属部门">{{ activeRow.dept }}</u-descriptions-item>
          <u-descriptions-item label="负责人">{{ activeRow.owner }}</u-descriptions-item>
          <u-descriptions-item label="健康度">{{ activeRow.health }}%</u-descriptions-item>
          <u-descriptions-item label="更新时间">{{ activeRow.updatedAt }}</u-descriptions-item>
        </u-descriptions>

        <div class="drawer-section">
          <span class="drawer-section-title">变更审计记录</span>
          <u-timeline class="mt-2">
            <u-timeline-item color="primary" timestamp="2026-11-26 16:40">
              <span>完成数据脱敏策略同步</span>
            </u-timeline-item>
            <u-timeline-item color="success" timestamp="2026-11-24 11:15">
              <span>通过季度 SLA 可用性巡检</span>
            </u-timeline-item>
          </u-timeline>
        </div>
      </div>
    </u-drawer>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@veltra/desktop'
import {
  UAction,
  UActionGroup,
  UAvatar,
  UButton,
  UCard,
  UCardContent,
  UCardHeader,
  UCheckTag,
  UDateRangePicker,
  UDescriptions,
  UDescriptionsItem,
  UDrawer,
  UIcon,
  UInput,
  UPaginator,
  UProgress,
  URate,
  USelect,
  UTable,
  UTag,
  UTimeline,
  UTimelineItem,
  UTree,
  message
} from '@veltra/desktop'
import { Search } from '@veltra/icons/normal'
import { computed, ref, shallowRef } from 'vue'

interface AssetRow {
  id: string
  name: string
  dept: string
  owner: string
  status: 'running' | 'pending' | 'archived'
  health: number
  rating: number
  updatedAt: string
}

const keyword = ref('')
const dept = ref<string>()
const dateRange = shallowRef<[Date, Date]>()
const statusFilter = ref('all')
const page = ref(1)
const pageSize = 4

const deptOptions = [
  { label: '基础架构部', value: '基础架构部' },
  { label: '数据智能部', value: '数据智能部' },
  { label: '业务中台部', value: '业务中台部' }
]

const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '运行中', value: 'running' },
  { label: '待审核', value: 'pending' },
  { label: '已归档', value: 'archived' }
]

const statusTagMap: Record<string, { label: string; type: 'success' | 'warning' | 'info' }> = {
  running: { label: '运行中', type: 'success' },
  pending: { label: '待审核', type: 'warning' },
  archived: { label: '已归档', type: 'info' }
}

const rows = ref<AssetRow[]>([
  {
    id: 'AST-1024',
    name: '用户画像宽表',
    dept: '数据智能部',
    owner: '林知夏',
    status: 'running',
    health: 96,
    rating: 5,
    updatedAt: '2026-11-26 14:20'
  },
  {
    id: 'AST-1025',
    name: '统一认证网关日志',
    dept: '基础架构部',
    owner: '陈默',
    status: 'running',
    health: 92,
    rating: 4,
    updatedAt: '2026-11-26 09:45'
  },
  {
    id: 'AST-1026',
    name: '订单履约实时流',
    dept: '业务中台部',
    owner: '周予安',
    status: 'pending',
    health: 74,
    rating: 4,
    updatedAt: '2026-11-25 19:10'
  },
  {
    id: 'AST-1027',
    name: '历史归档冷备库',
    dept: '基础架构部',
    owner: '吴越',
    status: 'archived',
    health: 88,
    rating: 3,
    updatedAt: '2026-11-20 11:00'
  }
])

const columns: TableColumn[] = [
  { key: 'name', name: '资产名称', minWidth: 160 },
  { key: 'dept', name: '部门', width: 120 },
  { key: 'owner', name: '负责人', width: 120 },
  { key: 'status', name: '状态', width: 100 },
  { key: 'health', name: '健康度', width: 130 },
  { key: 'rating', name: '重要度', width: 130 },
  { key: 'actions', name: '操作', width: 130, align: 'right' }
]

const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    const matchKw = !kw || r.name.toLowerCase().includes(kw) || r.owner.includes(kw)
    const matchDept = !dept.value || r.dept === dept.value
    const matchStatus = statusFilter.value === 'all' || r.status === statusFilter.value
    return matchKw && matchDept && matchStatus
  })
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredRows.value.slice(start, start + pageSize)
})

const assetTree = [
  {
    id: 'core',
    name: '核心数据域',
    children: [
      { id: 'user-profile', name: '用户画像宽表' },
      { id: 'order-stream', name: '订单履约实时流' }
    ]
  },
  {
    id: 'infra',
    name: '基础设施日志',
    children: [
      { id: 'auth-log', name: '统一认证网关日志' },
      { id: 'cold-bak', name: '历史归档冷备库' }
    ]
  }
]

const drawerVisible = ref(false)
const activeRow = shallowRef<AssetRow>()

const openDetail = (row: AssetRow) => {
  activeRow.value = row
  drawerVisible.value = true
}

const archiveRow = (row: AssetRow) => {
  row.status = 'archived'
  message.success(`已归档「${row.name}」`)
}

const resetFilters = () => {
  keyword.value = ''
  dept.value = undefined
  dateRange.value = undefined
  statusFilter.value = 'all'
}
</script>

<style scoped>
.scene-data {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.data-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

@media (min-width: 1024px) {
  .data-layout {
    grid-template-columns: 1fr 280px;
  }
}

.ml-auto {
  margin-left: auto;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drawer-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--u-text-color-title);
}
</style>
