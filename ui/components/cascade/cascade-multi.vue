<template>
  <div :class="[cls.e('multi'), cls.m(size), bem.is('disabled', disabled)]">
    <!-- 默认展示 -->
    <span :class="cls.e('placeholder')" v-show="!cascadeMulti.length">
      {{ placeholder }}
    </span>
    <!-- 选择的数据项 -->
    <div v-if="cascadeMulti.length" :class="cls.e('tags')">
      <u-tag
        v-for="(tag, index) in visibleTags"
        :key="tag + index"
        :closable="!disabled"
        @close="handleRemove(tag)"
      >
        {{ tag }}
      </u-tag>
      <u-tag v-if="hiddenCount > 0">+{{ hiddenCount }}</u-tag>
    </div>
    <!-- 清空 icon -->
    <transition name="zoom-in">
      <u-icon
        v-if="clearable && cascadeMulti?.length && hovered && !disabled"
        :class="cls.e('clear')"
        @click.stop="handleClear"
      >
        <Close />
      </u-icon>
    </transition>
    <!-- 下拉 icon -->
    <u-icon :class="cls.e(`arrow`)" v-if="!readonly">
      <ArrowDown />
    </u-icon>
  </div>
</template>

<script setup lang="ts">
import { CascadeDIKey } from "./di"
import { computed, inject } from "vue"
import { UTag } from "../tag"
import { UIcon } from "../icon"
import { Close, ArrowDown } from "icon-ultra"
import { bem } from "@ui/utils"

const injected = inject(CascadeDIKey)
const {
  cls,
  cascadeProps,
  cascadeMulti,
  disabled,
  readonly,
  hovered,
  size,
  clear,
  remove,
} = injected!

const { placeholder, clearable } = cascadeProps

defineOptions({
  name: "CascadeMulti",
})

const limit = () => {
  let { visibilityLimit } = cascadeProps

  if (!visibilityLimit) return
  if (visibilityLimit < 0) {
    visibilityLimit = 0
  }
  if (disabled.value || readonly.value) {
    visibilityLimit = cascadeMulti.value?.length ?? 0
  }
  return visibilityLimit
}
const visibleTags = computed(() => {
  if (cascadeMulti.value.length > limit()!) {
    return cascadeMulti.value.slice(0, limit())
  }
  return cascadeMulti.value
})

const hiddenCount = computed(() => {
  if (cascadeMulti.value.length > limit()!) {
    return cascadeMulti.value.length - limit()!
  }
  return 0
})

/**删除 */
const handleRemove = (tag: string) => {
  remove(tag)
}

/**清空 */
const handleClear = () => {
  clear()
}
</script>
