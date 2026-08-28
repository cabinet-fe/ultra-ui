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
    <template v-else-if="answers != null">
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
    <div v-else :class="cls.e('ask-question-status')">{{ error }}</div>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UInput } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, inject, ref, watch } from 'vue'

import type {
  AskQuestionAnswer,
  AskQuestionItem,
  AskQuestionResult
} from '../../tools/ask-question/ask-question'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatAskQuestion' })

const props = defineProps<{
  /** 问题列表；组件不再从 toolCall 解析参数 */
  questions: AskQuestionItem[]
  /** 已提交摘要；有值则展示结果而非表单 */
  answers?: AskQuestionAnswer[]
  /** 失败 / 取消文案 */
  error?: string
}>()

const emit = defineEmits<{
  /** 提交问答；值为答案数组（与 AskQuestionResult 兼容） */
  (e: 'submit', value: AskQuestionAnswer[] | AskQuestionResult): void
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** 作答中：尚未提交、也没有失败文案 */
const answering = computed(() => props.answers == null && !props.error)

/** 当前题索引 */
const current = ref(0)
/** 各题选中的预设选项 */
const selections = ref<(string | null)[]>([])
/** 各题的自定义输入 */
const customs = ref<string[]>([])

watch(
  () => props.questions,
  (list) => {
    if (props.answers != null) return
    selections.value = list.map(() => null)
    customs.value = list.map(() => '')
  },
  { immediate: true }
)

const currentQuestion = computed(() => props.questions[current.value])

/** 某题是否已作答：自定义输入非空优先，否则看选中项 */
const isAnswered = (index: number) => {
  return Boolean(customs.value[index]?.trim() || selections.value[index])
}

const allAnswered = computed(() => {
  return props.questions.length > 0 && props.questions.every((_, i) => isAnswered(i))
})

const goTo = (index: number) => {
  if (index < 0 || index >= props.questions.length) return
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
  const firstUnanswered = props.questions.findIndex((_, i) => !isAnswered(i))
  if (firstUnanswered >= 0) {
    current.value = firstUnanswered
    return
  }
  emit(
    'submit',
    props.questions.map((item, i) => ({
      question: item.question,
      answer: customs.value[i]?.trim() || selections.value[i] || ''
    }))
  )
}

/** 提交后的问答摘要：命中预设选项的回答渲染为 chip */
const doneAnswers = computed(() => {
  const list = props.answers
  if (!list?.length) return []
  return list.map((item) => ({
    question: item.question,
    answer: item.answer,
    isOption: props.questions.some(
      (q) => q.question === item.question && q.options?.includes(item.answer)
    )
  }))
})
</script>
