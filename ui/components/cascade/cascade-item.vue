<template>
  <u-scroll
    tag="ul"
    :class="cls.e('options')"
    ref="scrollRef"
    v-if="cascadeItem?.length"
  >
    <li
      v-for="(option, index) in cascadeItem"
      :class="[
        cls.e('option'),
        cls.m(size),
        bem.is('selected', option.selected),
      ]"
      :key="option[labelKey!]"
      :data-depth="option.depth"
      @click.stop="handleClick(option, $event)"
      ref="cascadeItemRef"
    >
      <slot v-bind="{ option, index }">
        {{ option[labelKey!] }}
        <u-icon v-if="option[childrenKey!]"><ArrowRight /></u-icon>
      </slot>
      <teleport to="body">
        <u-scroll
          tag="ul"
          :class="cls.e('options-item')"
          ref="scrollRef"
          v-if="showChildrenMenu && currentChildren"
          :style="childMenuStyle"
          @mouseleave="hideChildren($event, option.depth)"
        >
          <CascadeItem :cascadeItem="currentChildren" />
        </u-scroll>
      </teleport>
    </li>
  </u-scroll>
</template>

<script lang="ts" setup generic="Option extends Record<string, any>">
import { computed, inject, shallowRef, watch } from "vue"
import { bem, zIndex } from "@ui/utils"
import { CascadeDIKey } from "./di"
import { UIcon } from "../icon/index"
import { ArrowRight } from "icon-ultra"
import { UScroll } from "../scroll"
import type {
  CascadeEmits,
  CascadeItemProps,
} from "@ui/types/components/cascade"
import type { CascadeNode } from "./cascade-node"
import { Tree } from "cat-kit/fe"

defineOptions({
  name: "CascadeItem",
})

const props = withDefaults(defineProps<CascadeItemProps>(), {
  cascadeItem: undefined,
})

const emit = defineEmits<CascadeEmits<Option>>()

const cascadeItemRef = shallowRef<HTMLLIElement>()

const injected = inject(CascadeDIKey)

const { cls, cascadeProps, size, close, open, handleSelect, cascade } =
  injected!

const { labelKey, valueKey, childrenKey, multiple } = cascadeProps

const showChildrenMenu = shallowRef(false)

const currentChildren = shallowRef<Record<string, any>[]>([])

const childMenuStyle = computed(() => {
  if (cascadeItemRef.value) {
    const rect = cascadeItemRef.value[0].offsetParent!.getBoundingClientRect()
    return {
      zIndex: zIndex(),
      top: `${rect.top}px`,
      left: `${rect.right}px`,
      width: `${rect.width}px`,
    }
  }
})

/** 递归选择并展示子菜单 */
const selectAndShowChildren = (items, value, depth) => {
  items.some((node) => {
    Tree.dft(node, (item) => {
      item.selected = value.includes(item.data[valueKey!])

      if (item.selected && cascadeItemRef.value) {
        // showChildrenMenu.value = true
        // currentChildren.value = item.data[childrenKey!] || []
        // const rect =
        //   cascadeItemRef.value[0].offsetParent!.getBoundingClientRect()
        // childMenuStyle.value = {
        //   zIndex: zIndex(),
        //   top: `${rect.top}px`,
        //   left: `${rect.right}px`,
        //   width: `${rect.width}px`,
        // }
        // if (item.data[childrenKey!] && item.data[childrenKey!].length) {
        //   selectAndShowChildren(item.data[childrenKey!], value, depth + 1)
        // } else {
        //   showChildrenMenu.value = false
        // }
        // } else if (item.data[childrenKey!]) {
        //   selectAndShowChildren(item.data[childrenKey!], value, depth + 1)
      }
    })
  })
}

watch(
  () => [props.cascadeItem, open],
  () => {
    console.log("弹窗打开了", cascade.value)
    if (cascade.value) {
      const data = cascade.value.split(" / ")
      console.log(data)

      selectAndShowChildren(props.cascadeItem!, data, 0)
    }
  },
  { immediate: true }
)

/** 单选 */
const handleClick = (option: CascadeNode<Record<string, any>>, event) => {
  !multiple && handleSelect(option)
  console.log(option.children)
  if (option.children === undefined) {
    close()
  } else {
    showChildren(option)
  }
}

/** 显示子菜单 */
const showChildren = (option: CascadeNode<Record<string, any>>) => {
  if (option[childrenKey!] && cascadeItemRef.value) {
    showChildrenMenu.value = true
    currentChildren.value = option[childrenKey!].map((item) => {
      item.selected = false
      return item
    })
  } else {
    showChildrenMenu.value = false
  }
}

/** 隐藏子菜单 */
const hideChildren = (event: MouseEvent, currentDepth: number) => {
  const target = event.relatedTarget as HTMLElement
  if (target.closest(`.${cls.e("options-item")}`)) {
    const relatedDepth = target
      ?.closest(`[data-depth]`)
      ?.getAttribute("data-depth")
    if (!relatedDepth || parseInt(relatedDepth, 10) < currentDepth) {
      showChildrenMenu.value = false
    }
  }
}
</script>
