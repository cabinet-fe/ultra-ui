<template>
  <label :class="cls.b">
    <textarea
      :class="classList"
      :style="{...styleObj, height: scrollHight}"
      :placeholder="props.placeholder"
      v-model="model"
      :maxlength="props.maxlength"
      :rows="props.rows"
      :cols="props.cols"
      @input="handleInput"
      :readonly="props.disabled"
      ref="textAreaRef"
    >
    </textarea>
    <span v-if="props.maxlength && props.showCount" :class="cls.m('count')">
      {{ initNum }}/{{ props.maxlength }}
    </span>
  </label>
</template>

<script lang="ts" setup>
import type {TextareaProps, TextareaEmits} from "@ui/types/components/textarea"
import {bem} from "@ui/utils"
import {computed, nextTick, onMounted, ref, shallowRef} from "vue"
import heightAuto from "./height-auto"
defineOptions({
  name: "Textarea",
})

const props = withDefaults(defineProps<TextareaProps>(), {
  placeholder: "请输入",
  width: "100%",
  rows: 5,
  cols: 20,
  resizable:'vertical'
})

const cls = bem("textarea")

const model = shallowRef(props.modelValue)

const emit = defineEmits<TextareaEmits>()

const classList = computed(() => {
  return [
    cls.m(`more`),
    cls.m(`resize-${props.resizable}`),
    bem.is("textarea-disabled", props.disabled),
  ]
})

const styleObj = computed(() => {
  return {
    width: props.width,
    overflow: props.autosize ? "hidden" : "auto",
    paddingBottom: props.maxlength && props.showCount ? "30px" : "",
  }
})

const textAreaRef = ref<HTMLInputElement | null>(null)

/** 限制字符初始化 */
let initNum = ref(0)

let scrollHight = ref(props.height)

let moreElementHeight = ref(0)

const handleInput = (e: Event) => {
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
  if (!props.autosize) return
  scrollHight.value = "auto"
  countHeight()
}
const countHeight = async () => {
  await nextTick()
  const el = textAreaRef.value!
  let height = heightAuto(el, moreElementHeight.value)
  scrollHight.value = height + "px"
}

const countWordNum = (value: string | number) => {
  if (props.maxlength) {
    initNum.value = props.maxlength - String(value).length
  }
}
onMounted(() => {
  countWordNum(props.modelValue!)
  moreElementHeight.value = textAreaRef.value?.offsetHeight!
})
</script>
