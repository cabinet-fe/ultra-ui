<template>
  <aside :class="cls.e('panel')">
    <div :class="cls.e('panel-card')">
      <div :class="cls.e('panel-header')">
        <UIcon :class="[cls.e('panel-icon'), statusClass]">
          <component :is="headerIcon" />
        </UIcon>
        <span :class="cls.e('panel-title')">{{ panelTitle }}</span>
        <UIcon :class="cls.e('panel-close')" title="关闭面板" @click="emit('close')">
          <Close />
        </UIcon>
      </div>

      <UScroll :class="cls.e('panel-body')">
        <!-- render 组件与工具卡片同一契约（ChatToolRenderProps），可随 toolCall 状态实时更新 -->
        <component :is="tool.render" v-if="tool?.render" :tool-call="toolCall" />
        <div v-else :class="cls.e('panel-fallback')">
          <ToolData
            v-if="fallbackRaw"
            :title="toolCall.status === 'error' ? '错误' : '结果'"
            :node="fallbackNode"
            :raw="fallbackRaw"
            :tone="toolCall.status === 'error' ? 'error' : 'default'"
          />
        </div>
      </UScroll>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { UIcon, UScroll } from '@veltra/desktop'
import { Close } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject } from 'vue'

import type { ChatToolCall } from '../../chat/types'
import { AiChatDIKey } from './di'
import { resolveToolHeaderIcon, toolStatusClass } from './tool-call-brief'
import ToolData from './tool-data.vue'
import { toToolNode } from './tool-format'

defineOptions({ name: 'UAiChatSidePanel' })

const props = defineProps<{ toolCall: ChatToolCall }>()

const emit = defineEmits<{ (e: 'close'): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** 当前调用对应的工具定义（解析 icon/label/render） */
const tool = computed(() => di?.tools.value[props.toolCall.name])

const statusClass = computed(() => toolStatusClass(props.toolCall.status))

/** 头部图标：meta.icon > 宿主覆盖 > 内置名称规则 > 兜底；状态点走 status class */
const headerIcon = computed(() => resolveToolHeaderIcon(props.toolCall, tool.value, di))

/** 面板标题：优先工具定义的 panelTitle（业务对象 + 动作），缺省回落到 label ?? name */
const panelTitle = computed(() => {
  const t = tool.value
  const pt = t?.panelTitle
  if (typeof pt === 'function') return pt(props.toolCall)
  return pt ?? t?.label ?? props.toolCall.name
})

/** 未提供 render 时的兜底展示（面板工具通常都应提供 render） */
const fallbackRaw = computed(() => props.toolCall.error ?? props.toolCall.result)

const fallbackNode = computed(() => toToolNode(fallbackRaw.value))
</script>
