<template>
  <div :class="[cls.e('tool-data'), bem.is('error', tone === 'error')]">
    <div :class="cls.e('tool-data-head')">
      <span :class="cls.e('tool-data-title')">{{ title }}</span>
      <span v-if="shape" :class="cls.e('tool-data-shape')">{{ shape }}</span>
      <!-- 超长文本：人读视图内展开全文，不必切到原始 -->
      <button
        v-if="textOverflow"
        type="button"
        :class="cls.e('tool-data-raw-toggle')"
        @click="textOpen = !textOpen"
      >
        {{ textOpen ? '收起' : '展开' }}
      </button>
      <!-- 结构化数据：提供原文降级入口，排查问题时仍能看到模型原始输出 -->
      <button
        v-else-if="showRawToggle"
        type="button"
        :class="cls.e('tool-data-raw-toggle')"
        :title="rawOpen ? '查看整理后的内容' : '查看原始内容'"
        @click="rawOpen = !rawOpen"
      >
        {{ rawOpen ? '整理' : '原始' }}
      </button>
    </div>

    <pre v-if="rawOpen" :class="cls.e('tool-data-raw')">{{ raw }}</pre>
    <pre
      v-else-if="node.type === 'text'"
      :class="[cls.e('tool-data-text'), bem.is('code', node.code)]"
      >{{ shownText }}</pre>
    <ToolNode v-else :node="node" :depth="0" />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, inject, ref } from 'vue'

import { AiChatDIKey } from './di'
import type { ToolNode as ToolNodeValue } from './tool-format'
import { describeShape, previewText, TOOL_TEXT_PREVIEW } from './tool-format'
import ToolNode from './tool-node.vue'

defineOptions({ name: 'UAiChatToolData' })

const { title, node, raw, tone } = defineProps<{
  /** 区块标题：参数 / 结果 / 错误 / 视图 */
  title: string
  /** 已结构化的展示节点 */
  node: ToolNodeValue
  /** 原始文本：结构化视图下提供「原始」切换入口 */
  raw?: string
  /** error 时整块转危险色 */
  tone?: 'default' | 'error'
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const rawOpen = ref(false)
const textOpen = ref(false)

const shape = computed(() => describeShape(node))

/** 纯文本超过预览上限先截断（「展开」入口的显示条件），用户点「展开」再看全文 */
const textOverflow = computed(
  () => node.type === 'text' && node.text.length > TOOL_TEXT_PREVIEW.section
)

const shownText = computed(() => {
  if (node.type !== 'text') return ''
  return previewText(node.text, TOOL_TEXT_PREVIEW.section, textOpen.value)
})

/** 纯文本节点即整理结果本身，无需再切原始 */
const showRawToggle = computed(() => !!raw && node.type !== 'text')
</script>
