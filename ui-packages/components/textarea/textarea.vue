<template>
  <textarea
    :class="classList"
    :style="styleObj"
    :placeholder="props.placeholder"
    v-model="model"
    @input="updateModelValue"
  ></textarea>
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
  width: "300px",
  height: "150px",
  resize: "none",
})

const cls = bem("textarea")

const model = shallowRef(props.modelValue)

const emit = defineEmits<TextareaEmits>()

const classList = computed(() => {
  return [cls.b]
})

const styleObj = computed(() => {
  return {
    width: props.width,
    height: props.height,
    resize: props.resize,
  }
})

const updateModelValue = (e: Event) => {
  const value = (e.target as HTMLTextAreaElement).value
  emit("update:modelValue", value)
}
</script>
