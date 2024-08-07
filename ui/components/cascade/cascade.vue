<template>
  <u-dropdown
    v-if="!readonly"
    :class="[cls.b, bem.is('disabled', disabled), cls.m(size)]"
    :content-class="[cls.e('panel'), cls.em('panel', size)]"
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
        native-readonly
        @clear="clear"
      >
        <template #suffix>
          <u-icon :class="cls.e('arrow')"><ArrowDown /></u-icon>
        </template>
      </u-input>
      <!-- 多选展示 -->
      <UCascadeMulti v-else />
    </template>

    <template #content>
      <!-- 过滤 -->
      <div v-if="filterable" :class="[cls.e('content-filter'), cls.m(size)]">
        <u-input
          placeholder="输入关键字进行过滤"
          v-model="qs"
          :clearable="false"
          @clear="qsClear"
        >
          <template #suffix>
            <u-icon><Search /></u-icon>
          </template>
        </u-input>
      </div>
      <!-- 数据列表 -->
      <template v-if="cascadeData.length">
        <div :class="cls.e('content')" v-if="!filterData.length">
          <UCascadeNode v-bind="$attrs" :cascadeData="cascadeData" />
        </div>
        <div v-else>
          <UCascadeFilter v-bind="$attrs" :filterData="filterData" />
        </div>
      </template>
      <div :class="cls.e('empty')" v-else>
        <UEmpty />
      </div>
    </template>
  </u-dropdown>

  <div :class="[cls.m(size)]" v-else-if="cascade">
    <div :class="cls.e('tags')">
      <u-tag>
        {{ cascade }}
      </u-tag>
    </div>
  </div>

  <span v-else>{{ FORM_EMPTY_CONTENT }}</span>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import type { CascadeProps, CascadeEmits } from "@ui/types/components/cascade"
import { bem } from "@ui/utils"
import { computed, provide, shallowRef, watch } from "vue"
import { ArrowDown, Search } from "icon-ultra"
import { UCascadeNode, UCascadeMulti, UCascadeFilter } from "./index"
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
import { FORM_EMPTY_CONTENT } from "@ui/shared"

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

const qs = shallowRef<string>("")

/** 森林 */
const forest = computed(() => {
  const { valueKey, labelKey, options, disabledNode } = props
  return Forest.create(options as Option[], {
    createNode: disabledNode
      ? (data, index) => {
          const node = new CascadeNode({
            data,
            index,
            valueKey: valueKey!,
            labelKey: labelKey!,
          })
          if (data) {
            node.disabled = disabledNode(data, node) ?? false
          }
          return node
        }
      : (data, index) => {
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
  const dict = new Map<string | number, CascadeNode<Option>>()

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

const updatePosition = () => {
  dropdownRef.value?.updateDropdown()
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

/**按深度分离 */
function separateByDepth(data) {
  const result = {}
  function traverse(node, parent?: Option) {
    if (!result[node.depth]) {
      result[node.depth] = []
    }
    result[node.depth].push(node)
    node.parentNodes = parent ? parent.data[props.valueKey] : ""
    if (node.children) {
      node.children.forEach((child) => traverse(child, node))
    }
  }
  data.forEach((item) => traverse(item))
  return Object.keys(result)
    .sort((a: any, b: any) => a - b)
    .map((key) => result[key])
}

/**展示数据 */
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

watch(
  selected,
  (selected) => {
    cascade.value =
      selected.size === 0
        ? ""
        : Array.from(selected)
            .map((node) => node[props.labelKey!])
            .join(" / ")
  },
  {
    immediate: true,
  }
)

watch(checked, (checked) => {
  cascade.value =
    checked.size === 0
      ? ""
      : Array.from(checked)
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
    if (currentNode.disabled) {
      // 如果当前节点或其父节点被禁用，返回空字符串
      return ""
    }
    currentNode = currentNode.parent
    if (currentNode.data) {
      path.unshift(currentNode.data[props.labelKey!])
    }
  }
  if (node.disabled) {
    // 如果节点本身被禁用，返回空字符串
    return ""
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

/**清空数据 */
const clear = () => {
  props.multiple && checked.clear()
  !props.multiple && selected.clear()
  cascade.value = ""
  close()
}

/**
 * 删除单个项
 * @param tag 删除的标签
 */
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

const filterData = shallowRef<Record<string, any>[]>([])

const qsClear = () => {
  qs.value = ""
}

watch(qs, (qs) => {
  if (qs) {
    filterData.value = []
    forest.value.dft((node) => {
      if (node.label.includes(qs) && !node.disabled) {
        filterData.value.push(node)
      }
    })
  } else {
    filterData.value = []
  }
})

/** 筛选选中事件 */
const handleFilter = (data: string) => {
  cascade.value = data
  let filter = data.split(" / ")
  selected.clear()
  forest.value.dft((node) => {
    if (!node.disabled) {
      let nodePath = getNodePath(node.data)
      if (filter.includes(node.data[props.labelKey!]) && nodePath !== "") {
        selected.add(node.data)
      }
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
  updatePosition,
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
  filterData,
  qsClear,
  handleFilter,
  getNodePath,
})
</script>
