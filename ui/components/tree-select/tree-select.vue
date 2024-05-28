<template>
  <u-dropdown
    :class="[
      cls.b,
      cls.m(size),
      bem.is('disabled', disabled),
      bem.is('readonly', readonly),
    ]"
    trigger="click"
    max-width="auto"
    :disabled="disabled"
    :readonly="readonly"
    @mouseenter="mouse = true"
    @mouseleave="mouse = false"
    ref="dropdownRef"
  >
    <template #trigger>
      <u-input
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        :model-value="tags?.[labelKey]"
        @clear="handleClear"
        native-readonly
      >
        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>
    </template>
    <template #content>
      <!-- 过滤器 -->
      <div v-if="filterable" :class="[cls.e('content-filter'), cls.m(size)]">
        <u-input placeholder="输入关键字进行过滤" v-model="qs">
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>
      <!-- 菜单列表 -->
      <u-scroll
        tag="div"
        height="300px"
        ref="scrollRef"
        :class="cls.e('content-option')"
      >
        <u-tree
          v-bind="treeProps"
          v-model:selected="model"
          @update:selected="handleSelect"
          ref="treeRef"
          selectable
        ></u-tree>
      </u-scroll>
    </template>
  </u-dropdown>
</template>

<script lang="ts" setup generic="Val extends string | number">
import type {
  TreeSelectProps,
  TreeSelectEmits,
} from "@ui/types/components/tree-select"
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import { bem } from "@ui/utils"
import { UDropdown } from "../dropdown"
import { UTree, type TreeExposed } from "../tree"
import { UScroll, type ScrollExposed } from "../scroll"
import { UInput } from "../input"
import { UIcon } from "../icon"
import { ArrowDown, Search } from "icon-ultra"
import { computed, ref, shallowRef, watch } from "vue"
import { Tree, omit } from "cat-kit/fe"
defineOptions({
  name: "TreeSelect",
})

const cls = bem("tree-select")

const props = withDefaults(defineProps<TreeSelectProps<Val>>(), {
  labelKey: "label",
  valueKey: "value",
  placeholder: "请选择",
  expandAll: true,
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  size: "default",
  filterable: false,
  closeOnSelect: true,
})

const treeProps = computed(() => {
  return omit(props, [
    "tips",
    "field",
    "placeholder",
    "disabled",
    "label",
    "selected",
    "readonly",
    "checkable",
    "selectable",
  ])
})

const emit = defineEmits<TreeSelectEmits<Val>>()

/**过滤 */
const qs = shallowRef("")
watch(qs, (qs) => {
  treeRef.value?.filter(qs)
})
const model = defineModel<Val>()

const mouse = shallowRef(false)

const tags = ref<Record<string, any>>()

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props,
])

const treeRef = shallowRef<TreeExposed<Record<string, any>>>()

const dropdownRef = shallowRef<InstanceType<typeof UDropdown>>()

const scrollRef = shallowRef<ScrollExposed>()

const handleSelect = (selected?: Val, selectedData?: Record<string, any>) => {
  tags.value = selectedData
  emit("update:modelValue", selected!)
  closeDrop()
}

/**关闭弹窗 */
const closeDrop = () => {
  if (!props.closeOnSelect) return
  dropdownRef.value?.close()
}

/**清空 */
const handleClear = () => {
  tags.value = undefined
  model.value = undefined
  emit("update:modelValue", undefined!)
}

watch(
  () => [props.data, model.value],
  ([data, modelValue]) => {
    if (data && modelValue) {
      tags.value = undefined
      let found = false

      for (const item of data as Record<string, any>[]) {
        if (found) break // 如果已找到匹配值，停止外层循环

        Tree.dft(item, (node) => {
          if (node[props.valueKey] === modelValue) {
            tags.value = node
            found = true
            return false // 停止当前dft循环
          }
        })
      }
    }
  },
  {
    immediate: true,
  }
)

watch(scrollRef, (scroll) => {
  if (scroll && model.value !== undefined) {
    const treeNode =
      scroll.contentRef!.getElementsByClassName("is-selected")[0]!

    treeNode?.scrollIntoView({ block: "nearest", inline: "start" })
  }
})
</script>
