<template>
  <div v-if="jobs.length" :class="cls.b">
    <button type="button" :class="cls.e('head')" @click="expanded = !expanded">
      <span>作业 · {{ jobs.length }}</span>
      <UIcon :class="[cls.e('chevron'), bem.is('expanded', expanded)]">
        <ArrowRight />
      </UIcon>
    </button>
    <div v-if="expanded" :class="cls.e('list')">
      <div v-for="job in jobs" :key="job.id" :class="cls.e('item')">
        <UIcon :class="cls.e('icon')">
          <component :is="resolveToolIcon(job.kind, props.toolIcons ?? di?.toolIcons?.value)" />
        </UIcon>
        <span :class="[cls.e('label'), job.status === 'running' && 'u-shine']">
          {{ job.label }}
        </span>
        <span :class="[cls.e('dot'), bem.is(job.status)]" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { UIcon } from '@veltra/desktop'
import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { inject, ref } from 'vue'

import type { AiJobBarProps } from '../../types'
import { AiChatDIKey } from '../_shared/di'
import { resolveToolIcon } from '../_shared/tool-icons'

defineOptions({ name: 'UAiJobBar' })

const props = withDefaults(defineProps<AiJobBarProps>(), { defaultExpanded: true })

const di = inject(AiChatDIKey, undefined)
const cls = bem('ai-job-bar')

const expanded = ref(props.defaultExpanded)
</script>
