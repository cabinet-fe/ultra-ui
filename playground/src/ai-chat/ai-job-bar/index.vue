<template>
  <div>
    <CustomCard title="实时作业状态（运行扫光 · 完成 · 失败）">
      <div class="demo-actions">
        <UButton size="small" plain @click="markRunning('done')">将进行中置为完成</UButton>
        <UButton size="small" plain @click="markRunning('error')">将进行中置为失败</UButton>
        <UButton size="small" plain @click="addRunningJob">新增运行中作业</UButton>
        <UButton size="small" plain @click="resetJobs">重置作业列表</UButton>
      </div>

      <UAiJobBar :jobs="jobs" />
    </CustomCard>

    <CustomCard title="默认折叠态 (default-expanded=false)">
      <UAiJobBar :jobs="staticJobs" :default-expanded="false" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type ChatJob, UAiJobBar } from '@veltra/ai'
import { UButton } from '@veltra/desktop'
import { ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

const initialJobs = (): ChatJob[] => [
  { id: 'job-1', kind: 'bash', label: '执行 bun run lint 与增量单测', status: 'running' },
  { id: 'job-2', kind: 'fs', label: '扫描 playground/src/ai-chat 目录', status: 'done' },
  { id: 'job-3', kind: 'search', label: '检索 NAV 配置引用', status: 'done' },
  { id: 'job-4', kind: 'net', label: '同步远程模型目录（超时重试）', status: 'error' }
]

const jobs = ref<ChatJob[]>(initialJobs())
const staticJobs = initialJobs()
let jobSeq = 5

const markRunning = (status: 'done' | 'error') => {
  jobs.value = jobs.value.map((job) => (job.status === 'running' ? { ...job, status } : job))
}

const addRunningJob = () => {
  jobs.value = [
    ...jobs.value,
    { id: `job-${jobSeq++}`, kind: 'bash', label: `后台构建任务 #${jobSeq - 1}`, status: 'running' }
  ]
}

const resetJobs = () => {
  jobs.value = initialJobs()
}
</script>

<style scoped lang="scss">
.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
