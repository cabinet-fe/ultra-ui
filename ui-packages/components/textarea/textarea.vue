<template>
  <div :class="cls.b">
    <textarea
      :class="classList"
      :style="styleObj"
      :placeholder="props.placeholder"
      v-model="model"
      :maxlength="props.maxlength"
      :rows="props.rows"
      @input="updateModelValue"
    >
    </textarea>
    <span v-if="props.maxlength && props.showCount" :class="cls.m('count')">
      {{ initNum }}/{{ props.maxlength }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import type {TextareaProps, TextareaEmits} from "@ui/types/components/textarea"
import {bem} from "@ui/utils"
import {computed, shallowRef} from "vue"

defineOptions({
  name: "Textarea",
})

const props = withDefaults(defineProps<TextareaProps>(), {
  placeholder: "请输入",
  width: "200px",
  height: "100px",
  resize: "none",
})

const cls = bem("textarea")

const model = shallowRef(props.modelValue)

const emit = defineEmits<TextareaEmits>()

const classList = computed(() => {
  return [
    cls.m(`more`),
    cls.m(`resize-${props.resize}`),
    bem.is("textarea-disabled", props.disabled),
  ]
})

const styleObj = computed(() => {
  return {
    width: props.width,
    height: props.height,
    paddingBottom: props.maxlength && props.showCount ? "30px" : "",
  }
})

/** 限制字符初始化 */
let initNum = 0 || String(props.modelValue).length

const updateModelValue = (e: Event) => {
  const value = (e.target as HTMLTextAreaElement).value
  if (value.length > props.maxlength!) {
    // 如果输入的字符数超过了最大长度，截取字符串到最大长度
    const truncatedValue = value.slice(0, props.maxlength)
    emit("update:modelValue", truncatedValue)
    countWordNum(truncatedValue)
  } else {
    // 如果没有超过最大长度，则正常更新模型值
    emit("update:modelValue", value)
    countWordNum(value)
  }
}

const countWordNum = (value: string) => {
  if (props.maxlength) {
    initNum = props.maxlength - value.length
  }
}
</script>
