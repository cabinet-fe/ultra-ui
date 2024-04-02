<template>
  <div :class="cls.b" @mouseenter="mouse = true" @mouseleave="mouse = false">
    <textarea
      :class="classList"
      :placeholder="props.placeholder"
      v-model="model"
      :maxlength="props.maxlength"
      :rows="props.rows"
      :cols="props.cols"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @change="handleChange"
      :readonly="readonly"
      ref="textAreaRef"
    />
    <span v-if="props.maxlength && props.showCount" :class="cls.m('count')">
      {{ initNum }}/{{ props.maxlength }}
    </span>
    <span
      v-if="props.clearable && model!.length && mouse"
      :class="cls.m('clear')"
      @click.stop="handleClear"
    >
      <u-icon :size="12">
        <Close />
      </u-icon>
    </span>
  </div>
</template>

<script lang="ts" setup>
import type {TextareaProps, TextareaEmits} from "@ui/types/components/textarea"
import {bem, setStyles} from "@ui/utils"
import {computed, nextTick, onMounted, ref, shallowRef} from "vue"
import heightAuto from "./height-auto"
import {UIcon} from "../icon"
import {Close} from "icon-ultra"
import {
  useFocus,
  useFormComponent,
  useFormFallbackProps,
} from "@ui/compositions"
// todo: 优化
// 1. 使用useFormFallbackProps来控制表单组件的props（disabled..）
// 2. 去除resizable
// 3. 去除width
// 4. 使用defineModel来定义值
// 5. 使用计算属性来控制字符剩余长度(以及其他可能这样使用的代码)
defineOptions({
  name: "Textarea",
})

const props = withDefaults(defineProps<TextareaProps>(), {
  placeholder: "请输入",
  rows: 5,
  resize: true,
})

const cls = bem("textarea")

const {formProps} = useFormComponent()

const {disabled, readonly} = useFormFallbackProps([formProps ?? {}, props], {
  disabled: false,
  readonly: false,
})

const emit = defineEmits<TextareaEmits>()

const textAreaRef = ref<HTMLTextAreaElement | null>(null)

const model = defineModel<string>()

let scrollHight = shallowRef(props.height)

let moreElementHeight = shallowRef(0)

let mouse = shallowRef(false)

const classList = computed(() => {
  return [
    cls.m(`more`),
    bem.is("resize-none", !props.resize),
    bem.is("disabled", disabled.value),
    bem.is("readonly", readonly.value),
    bem.is("mouse", mouse.value),
  ]
})

const handleInput = (e: Event) => {
  const value = (e.target as HTMLTextAreaElement).value
  if (value.length > props.maxlength!) {
    // 如果输入的字符数超过了最大长度，截取字符串到最大长度
    const truncatedValue = value.slice(0, props.maxlength)
    emit("update:modelValue", truncatedValue)
  } else {
    // 如果没有超过最大长度，则正常更新模型值
    emit("update:modelValue", value)
  }
  if (!props.autosize) return
  setStyles(textAreaRef.value!, {height: "auto"})
  countHeight()
}

const countHeight = async () => {
  await nextTick()
  const el = textAreaRef.value!
  let height = heightAuto(el, moreElementHeight.value)
  scrollHight.value = height + "px"
  setStyles(el, {height: scrollHight.value})
}

const initNum = computed(() => {
  if (!props.maxlength) return 0
  return props.maxlength - (model.value?.length ?? 0)
})

const handleClear = () => {
  model.value = ""
  emit("clear")
}

const {handleBlur, handleFocus} = useFocus((focused) => {
  focused ? emit("focus") : emit("blur")
})

const handleChange = (e: Event) => {
  emit("change", (e.target as HTMLTextAreaElement).value)
}

onMounted(() => {
  if (!props.autosize) return
  moreElementHeight.value = textAreaRef.value?.offsetHeight!
})
</script>
