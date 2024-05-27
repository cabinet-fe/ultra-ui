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
import { TreeNode, type TreeExposed, type UTree } from "../tree"
import { UScroll, type ScrollExposed } from "../scroll"
import { UIcon } from "../icon"
import { ArrowDown, Search } from "icon-ultra"
import { computed, onMounted, shallowRef, watch } from "vue"
import { Forest, omit } from "cat-kit/fe"
import type { UInput } from "../input"
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

const tags = shallowRef<Record<string, any>>()

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

/** 森林 */
const forest = computed(() => {
  TreeNode.labelKey = props.labelKey
  TreeNode.valueKey = props.valueKey
  return Forest.create(props.data!, TreeNode)
})

/**回显 */
const echoTags = () => {
  if (model.value) {
    tags.value = []
    forest.value.dft((node) => {
      if (model.value === node.data[props.valueKey]) {
        tags.value = node.data
      }
    })
  }
}

watch(scrollRef, (scroll) => {
  if (scroll && model.value !== undefined) {
    const treeNode =
      scroll.contentRef!.getElementsByClassName("is-selected")[0]!

    treeNode?.scrollIntoView({ block: "nearest", inline: "start" })
  }
})

onMounted(() => {
  echoTags()
})
</script>
