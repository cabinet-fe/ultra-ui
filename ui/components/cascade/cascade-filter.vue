<template>
  <u-scroll tag="ul" :class="[cls.e('options'), cls.m(size)]" ref="scrollRef">
    <li
      v-for="(data, index) in filteredPaths"
      :class="[cls.e('option'), bem.is('selected', selectedIndex === index)]"
      @click="handleClick(data, index)"
      :key="index"
      v-ripple="cls.e('ripple')"
    >
      {{ data }}
    </li>
  </u-scroll>
</template>

<script setup lang="ts">
import { computed, inject, shallowRef, watch } from "vue"
import { CascadeDIKey } from "./di"
import type { CascadeFilterProps } from "@ui/types/components/cascade"
import { UScroll } from "../scroll"
import { bem } from "@ui/utils"
import { vRipple } from "@ui/directives"

const props = withDefaults(defineProps<CascadeFilterProps>(), {
  selectAndReset: true,
})

defineOptions({
  name: "CascadeFilter",
})

const injected = inject(CascadeDIKey)

const { cls, size, handleFilter, getNodePath, cascade, qsClear, close } =
  injected!

const selectedIndex = shallowRef(-1)

const filteredPaths = computed(() => {
  return props.filterData!.map((node) => getNodePath(node.data)).filter(path => path !== "");
});

const handleClick = (data: string, index: number) => {
  selectedIndex.value = index
  handleFilter(data)

  if (!props.selectAndReset) return
  qsClear()
  close()
}

watch(
  () => cascade.value,
  (val) => {
    selectedIndex.value = props.filterData!.findIndex((node) => {
      return getNodePath(node.data) === val
    })
  },
  { immediate: true }
)
</script>
