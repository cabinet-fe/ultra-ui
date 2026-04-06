<template>
  <div :class="[cls.b, cls.m(size)]" ref="paginatorRef">
    <div>共 {{ total }} 条</div>

    <u-select
      :class="cls.e('size-select')"
      v-model="pageSize"
      size="small"
      :options="sizeOptions"
      :clearable="false"
      @change="handleChangePageSize"
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
        <UIcon v-else><ChevronsLeft /></UIcon>
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
        <UIcon v-else><ChevronsRight /></UIcon>
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
} from '@ultra-ui/pc/types'
import { bem } from '@ultra-ui/core'
import { useConfig, useFallbackProps } from '@ultra-ui/core'
import { computed, reactive, shallowRef } from 'vue'
import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { UNumberInput } from '../number-input'
import { USelect } from '../select'
import { UIcon } from '../icon'
import { vRipple } from '@ultra-ui/directives'
import { n } from '@cat-kit/core'

defineOptions({
  name: 'Paginator'
})

const { config } = useConfig()

const props = withDefaults(defineProps<PaginatorProps>(), {
  total: 0
})

const emit = defineEmits<PaginatorEmits>()

const cls = bem('paginator')

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const pageNumber = defineModel<number>('pageNumber', {
  default: 1
})

const pageSize = defineModel<number>('pageSize', {
  default: 10
})


function emitPageSize(value: number) {
  emit('change:pageSize', value)
}

function emitPageNumber(value: number) {
  emit('change:pageNumber', value)
}

const handleChangePageSize = (size?: Record<string, any>) => {
  emitPageSize(size?.value)
  pageNumber.value = 1
}

function handleChangePageNumber(num: number) {
  if (props.pageNumber === num) return
  pageNumber.value = num
  emitPageNumber(pageNumber.value)
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
  const startPageNum = n(pageNumber.value - 2).range(
    1,
    Math.max(totalPages.value - 4, 1)
  )

  return Array.from({ length: Math.min(totalPages.value, 5) }).map(
    (_, index) => startPageNum + index
  )
})

const preDisabled = computed(() => {
  return pageNumber.value <= 1
})
const nextDisabled = computed(() => {
  return pageNumber.value >= totalPages.value
})

function handleJumpToFirst() {
  if (preDisabled.value) return
  pageNumber.value = 1
  emitPageNumber(pageNumber.value)
}
function handleJumpToLast() {
  if (nextDisabled.value) return
  pageNumber.value = totalPages.value
  emitPageNumber(pageNumber.value)
}
function handleJumpToPrev() {
  if (preDisabled.value) return
  pageNumber.value = pageNumber.value - 1
  emitPageNumber(pageNumber.value)
}
function handleJumpToNext() {
  if (nextDisabled.value) return

  pageNumber.value = pageNumber.value + 1
  emitPageNumber(pageNumber.value)
}

function handleKeyEnter(e: KeyboardEvent) {
  const target = e.target as HTMLInputElement
  const val = +target.value
  if (!isNaN(val) && val > 0 && val <= totalPages.value) {
    pageNumber.value = val
    emitPageNumber(pageNumber.value)
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
