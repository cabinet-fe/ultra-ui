<template>
  <div>
    <CustomCard title="交互式多题提问卡（单选推荐徽标 + 多选 + 已答摘要）">
      <div class="demo-actions">
        <UButton size="small" plain :disabled="!answers" @click="answers = undefined">
          重新作答
        </UButton>
        <span class="demo-hint">支持数字键 1-9 快选、Enter 前进/提交、←/→ 切题</span>
      </div>

      <UAiQuestionCard :questions="questions" :answers="answers" @submit="handleSubmit" />
    </CustomCard>

    <CustomCard title="错误态展示 (error)">
      <UAiQuestionCard :questions="singleQuestion" error="用户取消或会话连接中断，未能提交回答" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type AskQuestionAnswer, type AskQuestionItem, UAiQuestionCard } from '@veltra/ai'
import { UButton, message } from '@veltra/desktop'
import { ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

const questions: AskQuestionItem[] = [
  {
    header: '接入方式',
    question: '请选择你期望在业务页面中接入的对话形态',
    options: [
      { label: '独立组件自由拼装 (推荐)', description: '按需组合消息列表、输入栏与侧边面板' },
      { label: 'UAiChat 完整壳层', description: '一键启用内置状态机、布局与清除确认' }
    ]
  },
  {
    header: '附加能力',
    question: '希望启用哪些增强控件？（可多选）',
    multiple: true,
    options: ['Token 用量明细', '自定义上下文选项', '右侧工具面板', '待发送消息队列']
  }
]

const singleQuestion: AskQuestionItem[] = [
  { header: '环境确认', question: '选择目标部署环境', options: ['预发环境 (推荐)', '生产环境'] }
]

const answers = ref<AskQuestionAnswer[] | undefined>(undefined)

const handleSubmit = (result: AskQuestionAnswer[]) => {
  answers.value = result
  message.success(`已提交 ${result.length} 题答案`)
}
</script>

<style scoped lang="scss">
.demo-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.demo-hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
