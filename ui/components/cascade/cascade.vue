<template>
  <u-dropdown
    v-if="!readonly"
    :class="[cls.b, bem.is('disabled', disabled), cls.m(size)]"
    trigger="click"
    ref="dropdownRef"
    :disabled="disabled"
    :width="cascadeData.length ? 'auto' : ''"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <template #trigger>
      <!-- 单选展示 -->
      <u-input
        v-if="!multiple"
        :size="size"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="clearable"
        v-model="cascade"
        :native-readonly="filterable"
      >
        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>
      <!-- 多选展示 -->
      <UCascadeMulti v-else />
    </template>

    <template #content>
      <!-- 数据列表 -->
      <div :class="cls.e('content')" v-if="cascadeData.length">
        <UCascadeNode v-bind="$attrs" :cascadeData="cascadeData" />
      </div>
      <div :class="cls.e('empty')" v-else>
        <UEmpty />
      </div>
    </template>
  </u-dropdown>
  <template v-else>
    <div :class="[cls.m(size)]">
      <div v-if="cascade?.length" :class="cls.e('tags')">
        <u-tag v-for="option of cascade" :key="option[labelKey]">
          {{ option }}
        </u-tag>
      </div>
    </div>
  </template>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import type { CascadeProps, CascadeEmits } from "@ui/types/components/cascade"
import { bem } from "@ui/utils"
import { computed, provide, shallowRef, watch } from "vue"
import { ArrowDown } from "icon-ultra"
import { UCascadeNode, UCascadeMulti } from "./index"
import { CascadeDIKey } from "./di"
import { UInput } from "../input"
import { UTag } from "../tag"
import { UIcon } from "../icon"
import { UDropdown, type DropdownExposed } from "../dropdown"
import { Forest } from "cat-kit/fe"
import { CascadeNode } from "./cascade-node"
import { useSelect } from "./use-select"
import { useCheck } from "./use-check"
import { UEmpty } from "../empty"

defineOptions({
  name: "Cascade",
})

const cls = bem("cascade")

const emit = defineEmits<CascadeEmits>()

const props = withDefaults(defineProps<CascadeProps>(), {
  labelKey: "label",
  valueKey: "value",
  placeholder: "请选择",
  clearable: true,
  disabled: undefined,
  readonly: undefined,
  childrenKey: "children",
  filterable: false,
  options: () => [],
  visibilityLimit: 3,
})

const { formProps } = useFormComponent()
const { size, disabled, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: "default",
    disabled: false,
    readonly: false,
  }
)
const hovered = shallowRef(false)

const cascadeData = shallowRef<Record<string, any>[]>([])

/** 森林 */
const forest = computed(() => {
  const { valueKey, labelKey } = props
  return Forest.create(props.options, {
    createNode: (data, index) => {
      const node = new CascadeNode({
        data,
        index,
        valueKey: valueKey!,
        labelKey: labelKey!,
      })
      return node
    },
  })
})

/**
 * 节点的字典，key为指定的valueKey的值
 */
const nodeDict = computed(() => {
  const dict = new Map<string | number, CascadeNode<Record<string, any>>>()

  forest.value.dft((node) => {
    dict.set(node.key, node)
  })

  return dict
})

const dropdownRef = shallowRef<DropdownExposed>()

const close = () => {
  dropdownRef.value?.close()
}

const open = () => {
  dropdownRef.value?.open()
}

const { handleSelect, selected } = useSelect<Record<string, any>>({
  props,
  emit,
  nodeDict,
  forest,
})
const { checked, handleCheck } = useCheck<Record<string, any>>({
  props,
  emit,
  nodeDict,
  forest,
})

function separateByDepth(data) {
  const result = {}
  function traverse(node, parent?: Record<string, any>) {
    if (!result[node.depth]) {
      result[node.depth] = []
    }
    result[node.depth].push(node)
    node.parentNodes = parent ? parent.data[props.labelKey] : ""
    if (node.children) {
      node.children.forEach((child) => traverse(child, node))
    }
  }
  data.forEach((item) => traverse(item))
  return Object.keys(result)
    .sort((a: any, b: any) => a - b)
    .map((key) => result[key])
}

const cascade = shallowRef<string>()

watch(
  () => props.options,
  (option) => {
    if (option) {
      cascadeData.value = separateByDepth(forest.value.nodes)
    }
  },
  { immediate: true }
)

watch(selected, (selected) => {
  cascade.value = Array.from(selected)
    .map((node) => node[props.labelKey!])
    .join(" / ")
})

watch(checked, (checked) => {
  cascade.value = Array.from(checked)
    .map((node) => node[props.labelKey!])
    .join(" / ")
})

/**
 * 生成树形结构中各个节点的路径
 */
const getNodePath = (node) => {
  let path = [node[props.labelKey!]]
  let currentNode = nodeDict.value.get(node[props.valueKey!])
  while (currentNode?.parent) {
    currentNode = currentNode.parent
    if (currentNode.data) {
      path.unshift(currentNode.data[props.labelKey!])
    }
  }
  return path.join(" / ")
}

/**树形回显数据格式 */
const cascadeMulti = computed(() => {
  const paths = Array.from(checked).map((node) => getNodePath(node))

  const filteredPaths = paths.filter((path, index) => {
    return !paths.some((p, i) => i !== index && p.startsWith(path))
  })
  return filteredPaths
})

const clear = () => {
  props.multiple && checked.clear()
  !props.multiple && selected.clear()
}
const remove = (tag: string) => {
  let data = tag.split(" / ")
  let del = data[data.length - 1]
  forest.value.dft((node) => {
    if (node.label === del) {
      checked.delete(node.data)
      return
    }
  })
}
provide(CascadeDIKey, {
  cls,
  cascadeProps: props,
  size,
  disabled,
  readonly,
  close,
  open,
  forest,
  nodeDict,
  handleSelect,
  handleCheck,
  cascade,
  cascadeMulti,
  emit,
  hovered,
  clear,
  remove,
})
</script>
