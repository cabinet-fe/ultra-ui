<template>
  <div :class="cls.e('ask-question')">
    <!-- 作答中：分页向导 -->
    <template v-if="answering">
      <div v-if="questions.length > 1" :class="cls.e('ask-question-progress')">
        <span :class="cls.e('ask-question-count')">{{ current + 1 }} / {{ questions.length }}</span>
        <span :class="cls.e('ask-question-dots')">
          <span
            v-for="(_, i) in questions"
            :key="i"
            :class="[
              cls.e('ask-question-dot'),
              bem.is('current', i === current),
              bem.is('answered', isAnswered(i))
            ]"
            @click="goTo(i)"
          />
        </span>
      </div>

      <div :class="cls.e('ask-question-q')">
        <span v-if="questions.length > 1" :class="cls.e('ask-question-no')" aria-hidden="true">
          {{ current + 1 }}
        </span>
        {{ currentQuestion?.question }}
      </div>

      <div
        v-if="currentQuestion?.options?.length"
        :class="cls.e('ask-question-options')"
        role="radiogroup"
      >
        <button
          v-for="option in currentQuestion.options"
          :key="option"
          type="button"
          role="radio"
          :aria-checked="selections[current] === option"
          :class="[cls.e('ask-question-opt'), bem.is('selected', selections[current] === option)]"
          @click="pickOption(option)"
        >
          <span
            :class="[
              cls.e('ask-question-glyph'),
              bem.is('selected', selections[current] === option)
            ]"
            aria-hidden="true"
          />
          <span :class="cls.e('ask-question-opt-text')">{{ option }}</span>
        </button>
      </div>

      <UInput
        :model-value="customs[current]"
        :placeholder="currentQuestion?.placeholder ?? '自定义回答…'"
        @update:model-value="onCustomInput"
      />

      <footer :class="cls.e('ask-question-actions')">
        <UButton
          v-if="questions.length > 1"
          size="small"
          text
          :disabled="current === 0"
          @click="goTo(current - 1)"
        >
          上一个
        </UButton>
        <UButton
          v-if="current < questions.length - 1"
          size="small"
          type="primary"
          @click="goTo(current + 1)"
        >
          下一个
        </UButton>
        <UButton v-else size="small" type="primary" :disabled="!allAnswered" @click="handleSubmit">
          提交
        </UButton>
      </footer>
    </template>

    <!-- 提交后：问答摘要 -->
    <template v-else-if="toolCall.status === 'success'">
      <div v-for="(item, i) in doneAnswers" :key="i" :class="cls.e('ask-question-result')">
        <div :class="cls.e('ask-question-result-q')">
          <span
            v-if="doneAnswers.length > 1"
            :class="cls.e('ask-question-result-no')"
            aria-hidden="true"
          >
            {{ i + 1 }}
          </span>
          {{ item.question }}
        </div>
        <div :class="cls.e('ask-question-result-a')">
          <span v-if="item.isOption" :class="cls.e('ask-question-chip')">{{ item.answer }}</span>
          <template v-else>{{ item.answer }}</template>
        </div>
      </div>
    </template>

    <!-- 异常 / 取消 -->
    <div v-else :class="cls.e('ask-question-status')">{{ statusText }}</div>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UInput } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, inject, ref, watch } from 'vue'

import type { ChatToolCall } from '../../chat/types'
import type {
  AskQuestionArgs,
  AskQuestionItem,
  AskQuestionResult
} from '../../tools/ask-question/ask-question'
import { resolveAskQuestion } from '../../tools/ask-question/deferred'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatAskQuestion' })

const props = defineProps<{ toolCall: ChatToolCall }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** 模型输出的提问参数 */
const questions = computed<AskQuestionItem[]>(() => {
  try {
    const args = JSON.parse(props.toolCall.arguments || '{}') as Partial<AskQuestionArgs>
    return Array.isArray(args.questions) ? args.questions : []
  } catch {
    return []
  }
})

/** 作答中：execute 挂起等待用户提交 */
const answering = computed(() => {
  return (
    props.toolCall.result == null &&
    (props.toolCall.status === 'running' || props.toolCall.status === 'pending')
  )
})

/** 当前题索引 */
const current = ref(0)
/** 各题选中的预设选项 */
const selections = ref<(string | null)[]>([])
/** 各题的自定义输入 */
const customs = ref<string[]>([])

watch(
  questions,
  (list) => {
    if (props.toolCall.result != null) return
    selections.value = list.map(() => null)
    customs.value = list.map(() => '')
  },
  { immediate: true }
)

const currentQuestion = computed(() => questions.value[current.value])

/** 某题是否已作答：自定义输入非空优先，否则看选中项 */
const isAnswered = (index: number) => {
  return Boolean(customs.value[index]?.trim() || selections.value[index])
}

const allAnswered = computed(() => {
  return questions.value.length > 0 && questions.value.every((_, i) => isAnswered(i))
})

const goTo = (index: number) => {
  if (index < 0 || index >= questions.value.length) return
  current.value = index
}

/** 点选选项：再次点击取消选择；选中时清空自定义输入（两者互斥） */
const pickOption = (option: string) => {
  const i = current.value
  const selected = selections.value[i] === option ? null : option
  selections.value[i] = selected
  if (selected) customs.value[i] = ''
}

/** 自定义输入：有内容时清除已选选项（两者互斥） */
const onCustomInput = (value: string) => {
  customs.value[current.value] = value
  if (value) selections.value[current.value] = null
}

const handleSubmit = () => {
  const firstUnanswered = questions.value.findIndex((_, i) => !isAnswered(i))
  if (firstUnanswered >= 0) {
    current.value = firstUnanswered
    return
  }
  const answers = questions.value.map((item, i) => ({
    question: item.question,
    answer: customs.value[i]?.trim() || selections.value[i] || ''
  }))
  resolveAskQuestion(props.toolCall.id, { answers })
}

/** 提交后的问答摘要（含历史恢复：从序列化结果解析） */
const doneAnswers = computed(() => {
  if (props.toolCall.status !== 'success' || !props.toolCall.result) return []
  let result: AskQuestionResult
  try {
    result = JSON.parse(props.toolCall.result)
  } catch {
    return []
  }
  if (!Array.isArray(result?.answers)) return []
  return result.answers.map((item) => ({
    ...item,
    /** 命中预设选项的回答渲染为 chip */
    isOption: questions.value.some(
      (q) => q.question === item.question && q.options?.includes(item.answer)
    )
  }))
})

const statusText = computed(() => {
  if (props.toolCall.status !== 'error') return ''
  const err = props.toolCall.error ?? ''
  if (err.includes('Abort') || err.includes('取消')) return '已取消'
  return err || '提问失败'
})
</script>
