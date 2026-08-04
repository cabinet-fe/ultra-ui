<template>
  <div
    :class="cls.e('insert-count-menu')"
    @keydown.enter.capture.prevent="confirm"
    @keydown.escape.capture.prevent="close"
  >
    <span :class="cls.e('insert-count-prefix')">{{ prefix }}</span>
    <u-number-input
      v-model="count"
      size="small"
      :min="min"
      :max="max"
      :step="1"
      :class="cls.e('insert-count-input')"
    />
    <span :class="cls.e('insert-count-suffix')">{{ suffix }}</span>
    <button type="button" :class="cls.e('insert-btn')" @click="confirm">确认</button>
  </div>
</template>

<script lang="ts" setup>
import { ContextmenuRootDIKey, UNumberInput } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { inject, ref } from 'vue'

defineOptions({ name: 'USheetInsertCountMenuItem' })

/**
 * 右键菜单内嵌数量输入项：文案 + UNumberInput + 确认。
 * Enter 提交、Esc 关闭；提交/取消均经 ContextmenuRootDIKey 关闭菜单。
 * Enter/Esc 使用 capture：UNumberInput 内部 `@keydown.stop`，冒泡阶段收不到。
 */
const props = withDefaults(
  defineProps<{
    /** 输入框前缀文案，如「在上方插入」 */
    prefix: string
    /** 输入框后缀文案，如「行」 */
    suffix: string
    /** 默认数量 */
    defaultValue?: number
    min?: number
    max?: number
  }>(),
  { defaultValue: 1, min: 1, max: 1000 }
)

const emit = defineEmits<{ confirm: [n: number] }>()

const cls = bem('sheet')
const root = inject(ContextmenuRootDIKey, null)

const count = ref(props.defaultValue)

function clamp(n: number): number {
  return Math.min(props.max, Math.max(props.min, Math.floor(n) || props.min))
}

function close(): void {
  root?.onItemClickEnd()
}

function confirm(): void {
  emit('confirm', clamp(count.value ?? props.defaultValue))
  close()
}
</script>
