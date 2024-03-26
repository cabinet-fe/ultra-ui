<template>
  <div :class="cls.b" @mouseenter="mouse = true" @mouseleave="mouse = false">
    <textarea
      :class="classList"
      :style="{...styleObj, height: scrollHight}"
      :placeholder="props.placeholder"
      v-model="model"
      :maxlength="props.maxlength"
      :rows="props.rows"
      :cols="props.cols"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      :readonly="props.disabled"
      ref="textAreaRef"
    />
    <span v-if="props.maxlength && props.showCount" :class="cls.m('count')">
      {{ initNum }}/{{ props.maxlength }}
    </span>
    <span
      v-if="props.clearable && model!.length && mouse"
      :class="cls.m('clear')"
      @click="handleClear"
    >
      <u-icon :size="12">
        <Close />
      </u-icon>
    </span>
  </div>
</template>

<script lang="ts" setup>
import type {TextareaProps, TextareaEmits} from "@ui/types/components/textarea"
import {bem} from "@ui/utils"
import {computed, nextTick, onMounted, ref, shallowRef} from "vue"
import heightAuto from "./height-auto"
import {UIcon} from "../icon"
import {Close} from "icon-ultra"

defineOptions({
  name: "Textarea",
})

const props = withDefaults(defineProps<TextareaProps>(), {
  placeholder: "请输入",
  width: "100%",
  rows: 5,
  resizable: "vertical",
  size: "default",
})

const cls = bem("textarea")

const model = shallowRef(props.modelValue)

const emit = defineEmits<TextareaEmits>()

const textAreaRef = ref<HTMLTextAreaElement | null>(null)

/** 限制字符初始化 */
let initNum = ref(0)

let scrollHight = ref(props.height)

let moreElementHeight = ref(0)

let mouse = shallowRef(false)

const classList = computed(() => {
  return [
    cls.m(`more`),
    cls.m(props.size),
    cls.m(`resize-${props.resizable}`),
    bem.is("textarea-disabled", props.disabled),
    bem.is("mouse", mouse.value),
  ]
})

const styleObj = computed(() => {
  return {
    width: props.width,
    paddingBottom: props.maxlength && props.showCount ? "30px" : "",
  }
})

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

const handleClear = () => {
  model.value = ""
  countWordNum(model.value)
  emit("update:modelValue", model.value)
  emit("clear", model.value)
}

const handleFocus = () => {
  emit("focus")
}

const handleBlur = () => {
  emit("blur")
}

onMounted(() => {
  countWordNum(props.modelValue!)
  moreElementHeight.value = textAreaRef.value?.offsetHeight!
})
</script>
