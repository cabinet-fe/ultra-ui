<template>
  <div :class="[cls.b, cls.m(size)]">
    <div>共 {{ total }} 条</div>
    <div :class="cls.e('size')">
      <u-select
        :model-value="String(current.pageSize)"
        :options="
          pageSizeOptions.map((item) => {
            return { label: `${item}条/页`, value: `${item}` }
          })
        "
        @change="changePageSize"
        :disabled="disabled"
        :clearable="false"
      />
    </div>
    <ul :class="[cls.e('pages')]">
      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === 1)]"
        @click="disabled || pageNumber === 1 ? void 0 : jump('firstClick')"
        @mouseenter="mouseEvent('first', true)"
        @mouseleave="mouseEvent('first', false)"
        v-ripple
      >
        <span v-if="mouseState.first">1</span>
        <UIcon v-else><DArrowLeft /></UIcon>
      </li>

      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === 1)]"
        @click="disabled || pageNumber === 1 ? void 0 : jump('prevClick')"
        v-ripple
      >
        <UIcon><ArrowLeft /></UIcon>
      </li>

      <template v-if="!simple">
        <li
          v-for="page in showPages"
          :class="[cls.e('btn'), bem.is('active', pageNumber === page)]"
          @click="disabled ? void 0 : jump(page)"
          v-ripple
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
        v-ripple
      >
        <UIcon><ArrowRight /></UIcon>
      </li>
      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === pages.length)]"
        @click="disabled || pageNumber === pages.length ? void 0 : jump('lastClick')"
        @mouseenter="mouseEvent('last', true)"
        @mouseleave="mouseEvent('last', false)"
        v-ripple
      >
        <span v-if="mouseState.last">{{ pages.length }}</span>
        <UIcon v-else><DArrowRight /></UIcon>
      </li>
    </ul>

    <div :class="cls.e('jump')" v-if="!simple">
      <span>前往</span>
      <div :class="cls.em('jump', 'number')">
        <u-select
          :model-value="String(current.pageNumber)"
          :options="
            pages.map((page) => {
              return { label: `${page}`, value: `${page}` }
            })
          "
          @change="changePageNumber"
          :disabled="disabled"
          :clearable="false"
        />
      </div>
      <span>页</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PaginatorProps, PaginatorEmits } from '@ui/types/components/paginator'
import { bem } from '@ui/utils'
import { useFallbackProps } from '@ui/compositions'
import { computed, reactive, watch } from 'vue'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'
import { UNumberInput } from '../number-input'
import { USelect } from '../select'
import { UIcon } from '../icon'
import { vRipple } from '@ui/directives'

defineOptions({
  name: 'Paginator'
})

const props = defineProps<PaginatorProps>()

const emit = defineEmits<PaginatorEmits>()

const { size, simple, disabled, pageNumber, pageSize, total } = useFallbackProps([props], {
  size: 'default',
  simple: false,
  disabled: false,
  pageNumber: 1,
  pageSize: 10,
  total: 0
})

const cls = bem('paginator')
/** 完整页码 */
const pages = computed(() => {
  const res = Array.from(
    { length: Math.ceil(total.value / pageSize.value) },
    (_, index) => index + 1
  )
  // 当前页码大于总页数的时候回到第一页
  if (!res.includes(pageNumber.value)) {
    current.pageNumber = 1
    emit('update:pageNumber', 1)
  }
  return res
})
/** 始终展示5个页码 */
const showPages = computed(() => {
  let startIndex = pageNumber.value > 3 ? pageNumber.value - 3 : 0
  if (pageNumber.value < 4) {
    startIndex = 0
  } else if (pageNumber.value + 2 < pages.value.length) {
    startIndex = pageNumber.value - 3
  } else {
    startIndex = pages.value.length - 5
  }
  return pages.value.slice(
    startIndex,
    pageNumber.value + 2 > pages.value.length ? pages.value.length : startIndex + 5
  )
})
/** 切换每页显示数据量 */
const changePageSize = (data) => {
  emit('update:pageSize', Number(data.value))
}
/** 切换页码 */
const changePageNumber = (data) => {
  emit('update:pageNumber', Number(data.value))
}
/** 组件内状态 */
const current = reactive({
  pageNumber: 1,
  pageSize: 10
})
watch(
  () => pageNumber.value,
  (num) => (current.pageNumber = num),
  { immediate: true }
)
watch(
  () => pageSize.value,
  (size) => (current.pageSize = size),
  { immediate: true }
)
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
      current.pageNumber = pageNumber.value > 1 ? pageNumber.value - 1 : 1
    },
    nextClick() {
      current.pageNumber =
        pageNumber.value === pages.value.length ? pages.value.length : pageNumber.value + 1
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
