<template>
  <div :class="cls.b" tabindex="-1" @keydown="onCardKeydown">
    <template v-if="answering">
      <div v-if="questions.length > 1" :class="cls.e('progress')">
        <span :class="cls.e('count')">{{ current + 1 }} / {{ questions.length }}</span>
        <span :class="cls.e('dots')">
          <span
            v-for="(draft, i) in drafts"
            :key="i"
            :class="[
              cls.e('dot'),
              bem.is('current', i === current),
              bem.is('answered', isAnswered(i) || draft.skipped)
            ]"
            @click="goTo(i)"
          />
        </span>
      </div>

      <div :class="cls.e('q')">
        <span v-if="questions.length > 1" :class="cls.e('no')" aria-hidden="true">
          {{ current + 1 }}
        </span>
        <span v-if="currentQuestion?.header" :class="cls.e('tag')">
          {{ currentQuestion.header }}
        </span>
        <span>{{ currentQuestion?.question }}</span>
        <span v-if="currentIsMulti" :class="cls.e('mode')">多选</span>
      </div>

      <div
        v-if="normalizedOptions.length"
        :class="cls.e('options')"
        :role="currentIsMulti ? 'group' : 'radiogroup'"
      >
        <component
          :is="currentIsMulti ? 'div' : 'button'"
          v-for="(option, optIndex) in normalizedOptions"
          :key="`${optIndex}:${option.raw}`"
          :type="currentIsMulti ? undefined : 'button'"
          :role="currentIsMulti ? 'checkbox' : 'radio'"
          :tabindex="currentIsMulti ? 0 : undefined"
          :aria-checked="isOptionSelected(option.value)"
          :class="[cls.e('opt'), bem.is('selected', isOptionSelected(option.value))]"
          @click="pickOption(option.value)"
          @keydown="currentIsMulti && onMultiOptKeydown($event, option.value)"
        >
          <UCheckbox
            v-if="currentIsMulti"
            :model-value="isOptionSelected(option.value)"
            size="small"
            tabindex="-1"
            @click.stop
            @update:model-value="pickOption(option.value)"
          />
          <span
            v-else
            :class="[cls.e('num'), bem.is('selected', isOptionSelected(option.value))]"
            aria-hidden="true"
          >
            {{ optIndex + 1 }}
          </span>
          <span :class="cls.e('opt-body')">
            <span :class="cls.e('opt-title')">
              <span>{{ option.displayLabel }}</span>
              <span v-if="option.recommended" :class="cls.e('badge')">推荐</span>
            </span>
            <span v-if="option.description" :class="cls.e('opt-desc')">
              {{ option.description }}
            </span>
          </span>
        </component>
      </div>

      <div :class="[cls.e('custom'), bem.is('active', hasCustom)]">
        <UCheckbox
          v-if="normalizedOptions.length && currentIsMulti"
          :model-value="hasCustom"
          size="small"
          :disabled="!hasCustom"
          tabindex="-1"
          @click.stop
          @update:model-value="clearCustom"
        />
        <span
          v-else-if="normalizedOptions.length"
          :class="[cls.e('num'), bem.is('selected', hasCustom)]"
          aria-hidden="true"
        >
          {{ normalizedOptions.length + 1 }}
        </span>
        <input
          ref="customInputRef"
          type="text"
          :class="cls.e('input')"
          :value="currentDraft?.custom ?? ''"
          :placeholder="currentQuestion?.placeholder ?? '自定义回答，按 Enter 确认…'"
          @input="onCustomInput"
          @keydown="onInputKeydown"
        />
        <span v-if="hasCustom" :class="cls.e('enter-hint')" aria-hidden="true">↵</span>
      </div>

      <footer :class="cls.e('actions')">
        <UButton size="small" text @click="handleSkip">跳过</UButton>
        <span :class="cls.e('actions-spacer')" />
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

    <template v-else-if="answers != null">
      <div :class="cls.e('head')">
        <UIcon :class="cls.e('head-icon')"><QuestionFilled /></UIcon>
        <span>
          {{ answers.length > 1 ? `已回答 ${answers.length} 个问题` : '已回答' }}
        </span>
      </div>
      <div v-for="(item, i) in answers" :key="i" :class="cls.e('result')">
        <div :class="cls.e('result-q')">
          <span v-if="answers.length > 1" :class="cls.e('result-no')" aria-hidden="true">
            {{ i + 1 }}
          </span>
          <span>{{ item.question }}</span>
        </div>
        <div :class="cls.e('result-a')">
          <span v-if="item.skipped" :class="cls.e('skipped')">已跳过</span>
          <template v-else-if="item.answer || item.answers?.length">
            {{ item.answer || item.answers?.join('、') }}
          </template>
          <span v-else :class="cls.e('skipped')">未作答</span>
        </div>
      </div>
    </template>

    <div v-else :class="cls.e('status')">{{ error }}</div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { UButton, UCheckbox, UIcon } from '@veltra/desktop'
import { QuestionFilled } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, ref, useTemplateRef, watch } from 'vue'

import type { AskQuestionAnswer, AskQuestionOption } from '../../tools'
import type { AiQuestionCardEmits, AiQuestionCardProps } from '../../types'

defineOptions({ name: 'UAiQuestionCard' })

const props = defineProps<AiQuestionCardProps>()

const emit = defineEmits<AiQuestionCardEmits>()

const cls = bem('ai-question-card')
const customInputRef = useTemplateRef<HTMLInputElement>('customInputRef')

interface NormalizedOption {
  raw: string
  displayLabel: string
  value: string
  description?: string
  recommended: boolean
}

interface QuestionDraft {
  options: string[]
  custom: string
  skipped: boolean
}

const RECOMMENDED_PATTERN =
  /^(?:\(Recommended\)|\(推荐\)|（推荐）)\s*|\s*(?:\(Recommended\)|\(推荐\)|（推荐）)$/i

function normalizeOption(opt: string | AskQuestionOption): NormalizedOption {
  const raw = typeof opt === 'string' ? opt : opt.label
  const trimmed = raw.trim()
  const clean = trimmed.replace(RECOMMENDED_PATTERN, '').trim()
  const recommended = clean !== trimmed
  const displayLabel = clean || trimmed
  return {
    raw,
    displayLabel,
    value: displayLabel || raw,
    description: typeof opt === 'string' ? undefined : opt.description,
    recommended
  }
}

/** 作答中：尚未提交、也没有失败文案 */
const answering = computed(() => props.answers == null && !props.error)
const current = ref(0)
const drafts = ref<QuestionDraft[]>([])

watch(
  () => props.questions,
  (list) => {
    if (props.answers != null) return
    current.value = 0
    drafts.value = list.map(() => ({ options: [], custom: '', skipped: false }))
  },
  { immediate: true }
)

const currentQuestion = computed(() => props.questions[current.value])
const currentIsMulti = computed(() => Boolean(currentQuestion.value?.multiple))
const currentDraft = computed(() => drafts.value[current.value])
const hasCustom = computed(() => Boolean(currentDraft.value?.custom.trim()))
const normalizedOptions = computed(() =>
  (currentQuestion.value?.options ?? []).map(normalizeOption)
)

const isOptionSelected = (value: string) => currentDraft.value?.options.includes(value) ?? false

const isAnswered = (index: number) => {
  const draft = drafts.value[index]
  return Boolean(draft?.custom.trim() || draft?.options.length)
}

const allAnswered = computed(
  () =>
    props.questions.length > 0 &&
    props.questions.every((_, i) => isAnswered(i) || Boolean(drafts.value[i]?.skipped))
)

const goTo = (index: number) => {
  if (index >= 0 && index < props.questions.length) current.value = index
}

/** 点选选项：单选选中后若非最后一题自动跳转到下一题；多选切换勾选且可与自定义输入共存 */
const pickOption = (value: string) => {
  const draft = currentDraft.value
  if (!draft) return
  draft.skipped = false
  if (currentIsMulti.value) {
    draft.options = draft.options.includes(value)
      ? draft.options.filter((item) => item !== value)
      : [...draft.options, value]
    return
  }
  const next = draft.options[0] === value ? [] : [value]
  draft.options = next
  if (next.length) {
    draft.custom = ''
    if (current.value < props.questions.length - 1) {
      goTo(current.value + 1)
    }
  }
}

const clearCustom = (checked?: boolean) => {
  if (!checked && currentDraft.value) currentDraft.value.custom = ''
}

const onMultiOptKeydown = (event: KeyboardEvent, value: string) => {
  if (event.key !== ' ' && event.key !== 'Enter') return
  event.preventDefault()
  event.stopPropagation()
  pickOption(value)
}

const onCustomInput = (event: Event) => {
  const draft = currentDraft.value
  if (!draft) return
  const value = (event.target as HTMLInputElement).value
  draft.custom = value
  if (value.trim()) draft.skipped = false
  if (!currentIsMulti.value && value) draft.options = []
}

const handleSubmit = () => {
  const firstUnanswered = props.questions.findIndex(
    (_, i) => !isAnswered(i) && !drafts.value[i]?.skipped
  )
  if (firstUnanswered >= 0) {
    current.value = firstUnanswered
    return
  }
  const result: AskQuestionAnswer[] = props.questions.map((item, i) => {
    const draft = drafts.value[i]
    if (draft?.skipped && !isAnswered(i)) {
      return { question: item.question, answer: '', skipped: true }
    }
    const custom = draft?.custom.trim() || ''
    if (item.multiple) {
      const picked = [...(draft?.options ?? [])]
      if (custom && !picked.includes(custom)) picked.push(custom)
      return { question: item.question, answer: picked.join('、'), answers: picked }
    }
    return { question: item.question, answer: custom || draft?.options[0] || '' }
  })
  emit('submit', result)
}

const advanceOrSubmit = () => {
  if (current.value < props.questions.length - 1) {
    goTo(current.value + 1)
  } else {
    handleSubmit()
  }
}

const handleSkip = () => {
  const draft = currentDraft.value
  if (!draft) return
  draft.options = []
  draft.custom = ''
  draft.skipped = true
  advanceOrSubmit()
}

const isConfirmEnter = (event: KeyboardEvent) =>
  event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229

const onInputKeydown = (event: KeyboardEvent) => {
  if (!isConfirmEnter(event)) return
  event.preventDefault()
  event.stopPropagation()
  if (isAnswered(current.value) || currentDraft.value?.skipped) advanceOrSubmit()
}

/** 卡片快捷键：非输入聚焦时 1-9 选选项、Enter 前进/提交、←/→ 切题 */
const onCardKeydown = (event: KeyboardEvent) => {
  if (!answering.value) return
  const target = event.target as HTMLElement | null
  if (
    target &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  ) {
    return
  }
  if (/^[1-9]$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const idx = Number(event.key) - 1
    const opts = normalizedOptions.value
    if (idx < opts.length) {
      event.preventDefault()
      pickOption(opts[idx]!.value)
    } else if (idx === opts.length && opts.length > 0) {
      event.preventDefault()
      customInputRef.value?.focus()
    }
    return
  }
  if (isConfirmEnter(event)) {
    if (isAnswered(current.value) || currentDraft.value?.skipped) {
      event.preventDefault()
      advanceOrSubmit()
    }
    return
  }
  if (event.key === 'ArrowLeft') goTo(current.value - 1)
  else if (event.key === 'ArrowRight') goTo(current.value + 1)
}
</script>
