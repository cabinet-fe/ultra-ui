<template>
  <div :class="[cls.b, cls.e(size)]">
    <ul :class="[cls.e('pages'), cls.m(size)]">
      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === 1)]"
        @click="jump('first')"
        @mouseenter="mouseEvent('first', true)"
        @mouseleave="mouseEvent('first', false)"
      >
        <span v-if="mouseState.first">1</span>
        <UIcon v-else><DArrowLeft /></UIcon>
      </li>

      <li :class="[cls.e('btn'), bem.is('disabled', pageNumber === 1)]" @click="jump('prev')">
        <UIcon><ArrowLeft /></UIcon>
      </li>

      <!-- todo:if和for的优先级 -->
      <template v-if="!simple">
        <li
          v-for="page in showPages"
          :class="[cls.e('btn'), bem.is('active', pageNumber === page)]"
          @click="jump(page)"
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
          v-model="currentPage"
          :clearable="false"
          @change="(val) => jump(val as number)"
        />/{{ pages.length }}
      </li>
      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === pages.length)]"
        @click="jump('next')"
      >
        <UIcon><ArrowRight /></UIcon>
      </li>
      <li
        :class="[cls.e('btn'), bem.is('disabled', pageNumber === pages.length)]"
        @click="jump('last')"
        @mouseenter="mouseEvent('last', true)"
        @mouseleave="mouseEvent('last', false)"
      >
        <span v-if="mouseState.last">{{ pages.length }}</span>
        <UIcon v-else><DArrowRight /></UIcon>
      </li>
    </ul>

    <u-select
      :model-value="String(pageSize)"
      :options="
        pageSizeOptions.map((item) => {
          return { label: String(item), value: String(item) }
        })
      "
      @update:model-value="changePageSize"
    />
  </div>
</template>

<script lang="ts" setup>
import type { PaginatorProps, PaginatorEmits } from '@ui/types/components/paginator'
import { bem } from '@ui/utils'
import { useFormFallbackProps, useFormComponent } from '@ui/compositions'
import { computed, reactive, ref } from 'vue'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'
import { UNumberInput } from '../number-input'
import { USelect } from '../select'
import { UIcon } from '../icon'

defineOptions({
  name: 'Paginator'
})

const props = defineProps<PaginatorProps>()

const emit = defineEmits<PaginatorEmits>()

const { formProps } = useFormComponent()

const { size, simple } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  simple: false
})

const cls = bem('paginator')
/** 完整页码 */
const pages = computed(() => {
  return Array.from({ length: Math.ceil(props.total / props.pageSize) }, (_, index) => index + 1)
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
}

const currentPage = ref<number>(props.pageNumber)

/** 跳转页码 */
const jump = (key: 'first' | 'last' | 'prev' | 'next' | number) => {
  const jumps = {
    first() {
      currentPage.value = 1
    },
    last() {
      currentPage.value = pages.value.length
    },
    prev() {
      currentPage.value = props.pageNumber > 1 ? props.pageNumber - 1 : 1
    },
    next() {
      currentPage.value =
        props.pageNumber === pages.value.length ? pages.value.length : props.pageNumber + 1
    },
    default(key: number) {
      currentPage.value = key
    }
  }

  jumps[key] ? jumps[key]() : jumps.default(key as number)
  emit('update:pageNumber', currentPage.value)
  return
}

const mouseState = reactive({
  first: false,
  last: false
})

const mouseEvent = (key: 'first' | 'last' | 'prev' | 'next' | number, value: boolean) => {
  mouseState[key] = value
}
</script>
