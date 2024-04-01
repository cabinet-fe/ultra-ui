<template>
  <div :class="[cls.b, cls.m(size)]">
    <ul :class="[cls.e('pages')]">
      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === 1)]"
        @click="disabled || pageNumber === 1 ? void 0 : jump('firstClick')"
        @mouseenter="mouseEvent('first', true)"
        @mouseleave="mouseEvent('first', false)"
      >
        <span v-if="mouseState.first">1</span>
        <UIcon v-else><DArrowLeft /></UIcon>
      </li>

      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === 1)]"
        @click="disabled || pageNumber === 1 ? void 0 : jump('prevClick')"
      >
        <UIcon><ArrowLeft /></UIcon>
      </li>

      <!-- todo:if和for的优先级 -->
      <template v-if="!simple">
        <li
          v-for="page in showPages"
          :class="[cls.e('btn'), bem.is('active', pageNumber === page)]"
          @click="disabled ? void 0 : jump(page)"
        >
          {{ page }}
        </li>
      </template>

      <li v-else :class="cls.e('input')">
        <UNumberInput
          size="small"
          :min="1"
          :max="pages.length"
          :precision="0"
          v-model="current.pageNumber"
          :clearable="false"
          @change="(val) => jump(val as number)"
          :disabled="disabled"
        />/{{ pages.length }}
      </li>
      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === pages.length)]"
        @click="disabled || pageNumber === pages.length ? void 0 : jump('nextClick')"
      >
        <UIcon><ArrowRight /></UIcon>
      </li>
      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === pages.length)]"
        @click="disabled || pageNumber === pages.length ? void 0 : jump('lastClick')"
        @mouseenter="mouseEvent('last', true)"
        @mouseleave="mouseEvent('last', false)"
      >
        <span v-if="mouseState.last">{{ pages.length }}</span>
        <UIcon v-else><DArrowRight /></UIcon>
      </li>
    </ul>

    <u-select
      :model-value="String(current.pageNumber)"
      :options="pages"
      @update:model-value="changePageNumber"
      :disabled="disabled"
    />

    <u-select
      :model-value="String(current.pageSize)"
      :options="
        pageSizeOptions.map((item) => {
          return { label: String(item), value: String(item) }
        })
      "
      @update:model-value="changePageSize"
      :disabled="disabled"
    />
  </div>
</template>

<script lang="ts" setup>
import type { PaginatorProps, PaginatorEmits } from '@ui/types/components/paginator'
import { bem } from '@ui/utils'
import { useFallbackProps } from '@ui/compositions'
import { computed, reactive } from 'vue'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'
import { UNumberInput } from '../number-input'
import { USelect } from '../select'
import { UIcon } from '../icon'

defineOptions({
  name: 'Paginator'
})

const props = defineProps<PaginatorProps>()

const emit = defineEmits<PaginatorEmits>()

const { size, simple, disabled } = useFallbackProps([props], {
  size: 'default',
  simple: false,
  disabled: false
})

const cls = bem('paginator')
/** 完整页码 */
const pages = computed(() => {
  const res = Array.from(
    { length: Math.ceil(props.total / props.pageSize) },
    (_, index) => index + 1
  )
  // 当前页码大于总页数的时候回到第一页
  if (!res.includes(props.pageNumber)) {
    current.pageNumber = 1
    emit('update:pageNumber', 1)
  }
  return res
})
/** 始终展示5个页码 */
const showPages = computed(() => {
  let startIndex = props.pageNumber > 3 ? props.pageNumber - 3 : 0
  if (props.pageNumber < 4) {
    startIndex = 0
  } else if (props.pageNumber + 2 < pages.value.length) {
    startIndex = props.pageNumber - 3
  } else {
    startIndex = pages.value.length - 5
  }
  return pages.value.slice(
    startIndex,
    props.pageNumber + 2 > pages.value.length ? pages.value.length : startIndex + 5
  )
})
/** 切换每页显示数据量 */
const changePageSize = (data) => {
  console.log(data)
  emit('update:pageSize', Number(data.value))
}
/** 切换页码 */
const changePageNumber = (data) => {
  console.log(data)
  emit('update:pageNumber', Number(data))
}
/** 组件内状态 */
const current = reactive({
  pageNumber: props.pageNumber,
  pageSize: 10
})
/** 跳转页码 */
const jump = (key: 'firstClick' | 'lastClick' | 'prevClick' | 'nextClick' | number) => {
  const jumps = {
    firstClick() {
      current.pageNumber = 1
    },
    lastClick() {
      current.pageNumber = pages.value.length
    },
    prevClick() {
      current.pageNumber = props.pageNumber > 1 ? props.pageNumber - 1 : 1
    },
    nextClick() {
      current.pageNumber =
        props.pageNumber === pages.value.length ? pages.value.length : props.pageNumber + 1
    },
    default(key: number) {
      current.pageNumber = key
    }
  }

  if (jumps[key]) {
    jumps[key]()
    emit(key as any, current.pageNumber)
  } else {
    jumps.default(key as number)
  }
  emit('update:pageNumber', current.pageNumber)
  return
}
/** 鼠标停留位置 */
const mouseState = reactive({
  first: false,
  last: false
})
/** 用于鼠标停留期间图标和页码切换显示 */
const mouseEvent = (key: 'first' | 'last' | 'prev' | 'next' | number, value: boolean) => {
  mouseState[key] = value
}
</script>
