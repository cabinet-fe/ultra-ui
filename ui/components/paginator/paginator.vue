<template>
  <div :class="[cls.b, cls.m(size)]" ref="paginatorRef">
    <div>共 {{ total }} 条</div>

    <u-select
      :class="cls.e('size-select')"
      :model-value="currentSize"
      @update:model-value="handleUpdateSize"
      size="small"
      :options="sizeOptions"
      :clearable="false"
    />

    <ul :class="[cls.e('pages')]" v-if="!simple">
      <li
        :class="[cls.e('btn'), bem.is('disabled', preDisabled)]"
        @click="handleJumpToFirst"
        @mouseenter="hovered.first = true"
        @mouseleave="hovered.first = false"
        v-ripple="!preDisabled"
      >
        <span v-if="hovered.first">1</span>
        <UIcon v-else><DArrowLeft /></UIcon>
      </li>

      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === 1)]"
        @click="handleJumpToPrev"
        v-ripple="!preDisabled"
      >
        <UIcon><ArrowLeft /></UIcon>
      </li>

      <li
        v-for="num in pageNumbers"
        :key="num"
        :class="[cls.e('btn'), bem.is('active', pageNumber === num)]"
        @click="handleChangePageNumber(num)"
        v-ripple
      >
        {{ num }}
      </li>

      <li
        :class="[cls.e('btn'), bem.is('disabled', nextDisabled)]"
        @click="handleJumpToNext"
        v-ripple="!nextDisabled"
      >
        <UIcon><ArrowRight /></UIcon>
      </li>
      <li
        :class="[cls.e('btn'), bem.is('disabled', nextDisabled)]"
        @click="handleJumpToLast"
        @mouseenter="hovered.last = true"
        @mouseleave="hovered.last = false"
        v-ripple="!nextDisabled"
      >
        <span v-if="hovered.last">{{ totalPages }}</span>
        <UIcon v-else><DArrowRight /></UIcon>
      </li>
    </ul>

    <div :class="cls.e('jumper')">
      <span>前往</span>
      <u-number-input
        :class="cls.e('page-input')"
        size="small"
        :min="1"
        :max="totalPages"
        :precision="0"
        :model-value="pageNumber"
        :clearable="false"
        @keyup.enter="handleKeyEnter"
        @change="pageNumber = $event!"
      />
      <span>/ {{ totalPages }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  PaginatorProps,
  PaginatorEmits,
  _PaginatorExposed,
  ComponentSize
} from '@ui/types'
import { bem } from '@ui/utils'
import { useConfig, useFallbackProps } from '@ui/compositions'
import { computed, reactive, shallowRef, watch } from 'vue'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from '@ultra/icon'
import { UNumberInput } from '../number-input'
import { USelect } from '../select'
import { UIcon } from '../icon'
import { vRipple } from '@ui/directives'
import { n } from 'cat-kit/fe'

defineOptions({
  name: 'Paginator'
})

const { config } = useConfig()

const props = withDefaults(defineProps<PaginatorProps>(), {
  total: 0,
  pageNumber: 1
})

const emit = defineEmits<PaginatorEmits>()

const cls = bem('paginator')

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})


function updatePageNumber(value: number) {
  emit('update:pageNumber', value)
}

const handleUpdateSize = (value: number) => {
  emit('update:pageSize', value)
  // 重置页码为1
  updatePageNumber(1)
}

function handleChangePageNumber(num: number) {
  if (props.pageNumber === num) return

  updatePageNumber(num)
}



const currentSize = computed(() => {
  return props.pageSize ?? config.paginator.pageSize
})

/** 完整页码 */
const totalPages = computed(() => {
  return Math.ceil(props.total / currentSize.value)
})

const sizeOptions = computed(() => {
  return (props.pageSizeOptions ?? config.paginator.pageSizeOptions).map(
    value => {
      return { label: `${value}条`, value }
    }
  )
})

/** 做多显示5个页码 */
const pageNumbers = computed(() => {
  const startPageNum = n(props.pageNumber - 2).range(
    1,
    Math.max(totalPages.value - 4, 1)
  )

  return Array.from({ length: Math.min(totalPages.value, 5) }).map(
    (_, index) => startPageNum + index
  )
})

const preDisabled = computed(() => {
  return props.pageNumber <= 1
})
const nextDisabled = computed(() => {
  return props.pageNumber >= totalPages.value
})

function handleJumpToFirst() {
  if (preDisabled.value) return
  updatePageNumber(1)
}
function handleJumpToLast() {
  if (nextDisabled.value) return
  updatePageNumber(totalPages.value)
}
function handleJumpToPrev() {
  if (preDisabled.value) return
  updatePageNumber(props.pageNumber - 1)
}
function handleJumpToNext() {
  if (nextDisabled.value) return
  updatePageNumber(props.pageNumber + 1)
}

function handleKeyEnter(e: KeyboardEvent) {
  const target = e.target as HTMLInputElement
  const val = +target.value
  if (!isNaN(val) && val > 0 && val <= totalPages.value) {
    updatePageNumber(val)
  }
}

/** 鼠标停留位置 */
const hovered = reactive({
  first: false,
  last: false
})

const paginatorRef = shallowRef<HTMLElement>()

defineExpose<_PaginatorExposed>({
  el: paginatorRef
})
</script>
