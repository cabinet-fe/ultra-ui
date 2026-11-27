<template>
  <div class="scene-workspace">
    <!-- 顶部面包屑与操作栏 -->
    <u-card>
      <u-card-content class="toolbar-row">
        <div class="column gap-xs">
          <u-breadcrumb
            :items="[
              { title: '工作空间' },
              { title: '产品研发' },
              { title: 'Veltra 2.0 迭代看板' }
            ]"
          />
          <div class="row gap-md mt-1">
            <h2 class="scene-heading">Sprint 14 · 设计系统升级</h2>
            <u-tag type="primary" size="small">进行中</u-tag>
          </div>
        </div>

        <div class="row gap-md">
          <u-avatar-group :max="4">
            <u-avatar>张</u-avatar>
            <u-avatar>李</u-avatar>
            <u-avatar>王</u-avatar>
            <u-avatar>赵</u-avatar>
            <u-avatar>孙</u-avatar>
          </u-avatar-group>
          <u-button type="primary" @click="createVisible = true">
            <u-icon><Plus /></u-icon> 新建任务
          </u-button>
        </div>
      </u-card-content>
    </u-card>

    <u-alert
      type="info"
      title="迭代提示：拖拽下方看板卡片可实时流转任务状态，点击发布节点可切换当前检查阶段。"
      show-icon
      closable
    />

    <!-- 发布流水线节点 -->
    <u-card>
      <u-card-header>
        <div class="row-between w-full">
          <span class="section-title">发布流水线阶段</span>
          <span class="text-xs text-second">当前阶段：{{ currentStageLabel }}</span>
        </div>
      </u-card-header>
      <u-card-content>
        <u-progress-nodes v-model="activeStage" :nodes="pipelineNodes" color-type="primary" />
      </u-card-content>
    </u-card>

    <!-- 可拖拽看板 -->
    <u-kanban v-model:columns="kanbanColumns" class="kanban-board">
      <template #card="{ card }">
        <div class="kanban-card-body">
          <div class="row-between">
            <u-tag :type="card.tagType" size="small">{{ card.tag }}</u-tag>
            <u-rate :model-value="card.priority" :count="3" readonly />
          </div>
          <div class="kanban-card-title">{{ card.title }}</div>
          <div class="kanban-card-desc">{{ card.desc }}</div>
          <u-progress :percentage="card.progress" :type="card.tagType" class="mt-2" />
          <div class="row-between mt-3">
            <div class="row gap-xs">
              <u-avatar size="small">{{ card.owner }}</u-avatar>
              <span class="text-xs text-second">{{ card.due }}</span>
            </div>
            <span class="comment-pill">
              <u-icon><Message /></u-icon>
              <span>{{ card.comments }}</span>
            </span>
          </div>
        </div>
      </template>
    </u-kanban>

    <!-- 底部动态与检查清单 -->
    <div class="bottom-grid">
      <u-card>
        <u-card-header>
          <span class="section-title">研发动态</span>
        </u-card-header>
        <u-card-content>
          <u-timeline>
            <u-timeline-item color="success" timestamp="10 分钟前">
              <span class="text-sm"
                ><strong>李明</strong> 将「Table 虚拟滚动优化」移动至已完成</span
              >
            </u-timeline-item>
            <u-timeline-item color="primary" timestamp="1 小时前">
              <span class="text-sm"><strong>张晓</strong> 提交了主题 Token 暗色对比度校验 PR</span>
            </u-timeline-item>
            <u-timeline-item color="warning" timestamp="昨天 18:20">
              <span class="text-sm"><strong>王芳</strong> 更新了 Kanban 拖拽占位动画参数</span>
            </u-timeline-item>
          </u-timeline>
        </u-card-content>
      </u-card>

      <u-card>
        <u-card-header>
          <span class="section-title">上线前检查清单</span>
        </u-card-header>
        <u-card-content class="column gap-md">
          <u-steps
            :items="[
              { label: '代码评审' },
              { label: '样式校验' },
              { label: '单测通过' },
              { label: '构建发布' }
            ]"
            :current="2"
          />
          <u-alert
            type="success"
            title="样式约定校验与 42 项核心单测已全部通过"
            show-icon
            :closable="false"
          />
        </u-card-content>
      </u-card>
    </div>

    <!-- 新建任务弹窗 -->
    <u-dialog v-model="createVisible" title="新建看板任务" size="small">
      <div class="column gap-md">
        <div class="column gap-xs">
          <label class="field-label">任务标题</label>
          <u-input v-model="newTask.title" placeholder="例如：完善 DatePicker 快捷键支持" />
        </div>
        <div class="column gap-xs">
          <label class="field-label">任务描述</label>
          <u-textarea v-model="newTask.desc" :rows="3" placeholder="简要描述目标与验收标准" />
        </div>
        <div class="row gap-md">
          <div class="column gap-xs flex-1">
            <label class="field-label">所属模块</label>
            <u-select
              v-model="newTask.tag"
              :options="[
                { label: '核心组件', value: '核心组件' },
                { label: '视觉样式', value: '视觉样式' },
                { label: '文档示例', value: '文档示例' }
              ]"
            />
          </div>
          <div class="column gap-xs flex-1">
            <label class="field-label">优先级</label>
            <u-rate v-model="newTask.priority" :count="3" />
          </div>
        </div>
      </div>
      <template #footer>
        <u-button @click="createVisible = false">取消</u-button>
        <u-button type="primary" @click="addTask">添加到待处理</u-button>
      </template>
    </u-dialog>
  </div>
</template>

<script setup lang="ts">
import type { KanbanColumnItem } from '@veltra/desktop'
import {
  UAlert,
  UAvatar,
  UAvatarGroup,
  UBreadcrumb,
  UButton,
  UCard,
  UCardContent,
  UCardHeader,
  UDialog,
  UIcon,
  UInput,
  UKanban,
  UProgress,
  UProgressNodes,
  URate,
  USelect,
  USteps,
  UTag,
  UTextarea,
  UTimeline,
  UTimelineItem,
  message
} from '@veltra/desktop'
import { Message, Plus } from '@veltra/icons/normal'
import { computed, reactive, ref } from 'vue'

const activeStage = ref('test')
const pipelineNodes = [
  { label: '需求评审', value: 'plan' },
  { label: '研发实现', value: 'dev' },
  { label: '自动化测试', value: 'test' },
  { label: '灰度发布', value: 'canary' },
  { label: '全量上线', value: 'release' }
]
const currentStageLabel = computed(
  () => pipelineNodes.find((n) => n.value === activeStage.value)?.label ?? ''
)

const kanbanColumns = ref<KanbanColumnItem[]>([
  {
    key: 'todo',
    title: '待处理',
    items: [
      {
        id: 't-1',
        title: '完善 TreeSelect 多选标签折叠',
        desc: '支持 maxTagCount 超出后悬浮展示完整列表',
        tag: '核心组件',
        tagType: 'primary',
        priority: 3,
        progress: 15,
        owner: '张',
        due: '明天截止',
        comments: 4
      },
      {
        id: 't-2',
        title: '补充 Showcase 多场景案例',
        desc: '使用 Segment 与组合组件展示组件库完整风貌',
        tag: '文档示例',
        tagType: 'info',
        priority: 2,
        progress: 30,
        owner: '赵',
        due: '周五截止',
        comments: 2
      }
    ]
  },
  {
    key: 'doing',
    title: '进行中',
    items: [
      {
        id: 't-3',
        title: '暗色主题阴影与边框层次调优',
        desc: '提升卡片在深色背景下的通透感与对比度',
        tag: '视觉样式',
        tagType: 'warning',
        priority: 3,
        progress: 68,
        owner: '王',
        due: '今天 18:00',
        comments: 7
      }
    ]
  },
  {
    key: 'done',
    title: '已完成',
    items: [
      {
        id: 't-4',
        title: 'Table 固定列与虚拟滚动联动',
        desc: '万级数据滚动帧率稳定在 60fps',
        tag: '核心组件',
        tagType: 'success',
        priority: 2,
        progress: 100,
        owner: '李',
        due: '已交付',
        comments: 5
      }
    ]
  }
])

const createVisible = ref(false)
const newTask = reactive({ title: '', desc: '', tag: '核心组件', priority: 2 })

const addTask = () => {
  if (!newTask.title.trim()) {
    message.warning('请输入任务标题')
    return
  }
  const todoCol = kanbanColumns.value[0]
  if (todoCol) {
    todoCol.items.unshift({
      id: `t-${Date.now()}`,
      title: newTask.title.trim(),
      desc: newTask.desc.trim() || '新建协同任务',
      tag: newTask.tag,
      tagType: 'primary',
      priority: newTask.priority,
      progress: 0,
      owner: '我',
      due: '待排期',
      comments: 0
    })
  }
  newTask.title = ''
  newTask.desc = ''
  createVisible.value = false
  message.success('任务已添加至「待处理」')
}
</script>

<style scoped>
.scene-workspace {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.scene-heading {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--u-text-color-title);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--u-text-color-title);
}

.kanban-board {
  height: 440px;
}

.comment-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--u-bg-color-hover);
  color: var(--u-text-color-second);
  font-size: 12px;
}

.kanban-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kanban-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-title);
  margin-top: 4px;
}

.kanban-card-desc {
  font-size: 12px;
  color: var(--u-text-color-second);
  line-height: 1.5;
}

.bottom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 18px;
}
</style>
