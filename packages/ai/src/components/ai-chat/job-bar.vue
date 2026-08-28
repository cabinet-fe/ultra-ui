<template>
  <div v-if="jobs.length" :class="cls.e('job-bar')">
    <button type="button" :class="cls.e('job-bar-head')" @click="expanded = !expanded">
      <span>作业 · {{ jobs.length }}</span>
      <UIcon :class="[cls.e('job-bar-chevron'), bem.is('expanded', expanded)]">
        <ArrowRight />
      </UIcon>
    </button>
    <div v-if="expanded" :class="cls.e('job-bar-list')">
      <div v-for="job in jobs" :key="job.id" :class="cls.e('job-bar-item')">
        <UIcon :class="cls.e('job-bar-icon')">
          <component :is="resolveToolIcon(job.kind)" />
        </UIcon>
        <span :class="[cls.e('job-bar-label'), job.status === 'running' && 'u-shine']">
          {{ job.label }}
        </span>
        <span :class="[cls.e('job-bar-dot'), bem.is(job.status)]" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@veltra/desktop'
import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { inject, ref } from 'vue'

import type { ChatJob } from '../../chat/types'
import { AiChatDIKey } from './di'
import { resolveToolIcon } from './tool-icons'

defineOptions({ name: 'UAiChatJobBar' })

defineProps<{ jobs: ChatJob[] }>()

const expanded = ref(true)

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')
</script>
