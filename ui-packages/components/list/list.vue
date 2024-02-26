<template>
  <div :class="cls.b">
    <ul
      :class="cls.e('item')"
      @scroll="loadMore"
      :style="{ height: props.infiniteScroll == true ? height + 'px' : '' }"
    >
      <li
        v-for="(item, index) in visibleItems"
        :draggable="props.draggable"
        @dragstart="onDragStart($event, item)"
        @dragover.prevent="onDragOver"
        @drop="onDrop($event, index)"
        @dragend="onDragEnd"
      >
        <!-- 自定义样式 -->
        <slot name="content" v-if="$slots.content" :item="item" :index="index" />
        <!-- 默认样式 -->
        <div v-else :class="cls.e('container')">
          <!-- left  -->
          <div :class="cls.e('left')">
            <div :class="cls.e('checkbox')">
              <u-checkbox
                v-model="item.checked"
                v-if="showCheck"
                @update:model-value="handleUpdate(item, index)"
              ></u-checkbox>
            </div>

            <div :clsaa="cls.e('star')"></div>

            <div :class="cls.e('avatar')" v-if="item.avatar">
              <img :src="item.avatar" alt="" />
            </div>
          </div>
          <!-- left  end-->

          <!-- content -->
          <div :class="cls.e('content')">
            <h3>{{ item.title }}</h3>
            <div>{{ item.desc }}</div>
            <div>{{ item.date }}</div>
          </div>
          <!-- content end -->

          <!-- action -->
          <div :class="cls.e('action')" v-if="showActions">
            <u-button
              circle
              :icon="Delete"
              size="small"
              @click="handleDelete(item, index)"
            ></u-button>
            <u-button
              circle
              :icon="Message"
              size="small"
              @click="handleMessage(item, index)"
            ></u-button>
            <u-button
              circle
              :icon="Warning"
              size="small"
              @click="handleTip(item, index)"
            ></u-button>
          </div>
          <!-- action end-->
        </div>
      </li>
      <p v-if="props.infiniteScroll == true && noMore" :class="cls.e('loadMore')">没有更多了...</p>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { type ListProps, type ListEmits } from '@ui/types/components/list'
import { UCheckbox } from '../checkbox'
import { UButton } from '../button'
import { Delete, Message, Warning } from 'icon-ultra'
import { bem } from '@ui/utils'
import { computed, ref } from 'vue'

defineOptions({
  name: 'List'
})
const cls = bem('list')

const emit = defineEmits<ListEmits>()

const props = withDefaults(defineProps<Partial<ListProps>>(), {
  /** 每页显示多少条 */
  itemsPerPage: 20,

  /** 是否无限滚动 */
  infiniteScroll: false
})

const height = document.documentElement.clientHeight
/** 是否拖拽 */
// let draggable = ref(true)

/** 没有更多了 */
const noMore = ref(false)

/** 所有列表 */
const items = ref<any>(props.data)

/** 当前页码 */
const currentPage = ref(1)

/** 每页显示多少条 */
const itemsPerPage = ref(props.itemsPerPage || 10)

/** 要显示的列表 */
const visibleItems = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value

  const endIndex = startIndex + itemsPerPage.value

  return items.value?.slice(0, endIndex)
})

/** 显示加载更多按钮 */
const showLoadMoreButton = computed(() => {
  return visibleItems.value.length < items.value.length
})

/** 加载更多 */
const loadMore = e => {
  if (props.infiniteScroll == false) return
  let scrollTop = e.target.scrollTop

  let scrollHeight = e.target.scrollHeight

  let clientHeight = e.target.clientHeight

  console.log(scrollTop, 'scrollTop', clientHeight, 'clientHeight', scrollHeight, 'scrollHeight')

  if (scrollTop + clientHeight == scrollHeight) {
    console.log('没有更多了')
    noMore.value = true
  } else {
    // loading.value = true
    currentPage.value++
  }
}

/** 删除 */
const handleDelete = (item: any, index: number) => {
  emit('delete', item, index)
}
const handleMessage = (item: any, index: number) => {
  emit('message', item, index)
}
const handleTip = (item: any, index: number) => {
  emit('tip', item, index)
}
const handleUpdate = (item: any, index: number) => {
  let list = props.data?.filter(item => item.checked)
  emit('update:check', list)
}

let listText = ref()

const onDragStart = (event: DragEvent, text) => {
  console.log(event, 'onDragStart')

  listText.value = text
}

const onDragOver = (event: DragEvent) => {
  console.log(event, 'onDragOver')

  event.preventDefault()
}

const onDrop = (event: DragEvent, index: number) => {
  console.log(event, index, 'onDrop')
  event.preventDefault()

  // listText.value = (event.target as HTMLElement).innerHTML
  // console.log(listText.value, 'listText.value')

  // const dragText = event.dataTransfer?.getData('drag_text')
  // console.log(dragText, 'dragText')

  const dragText = listText.value

  if (dragText !== undefined) {
    visibleItems.value.splice(index, 1, dragText)
  }
}

const onDragEnd = (event: DragEvent) => {
  event.preventDefault()

  listText.value = ''
  // const index = visibleItems.value.indexOf(listText.value)
  // console.log(index)

  // if (index !== -1) {
  //   visibleItems.value.splice(index, 1, listText.value)
  //   console.log(visibleItems.value, 'if-index-1')
  // }
}
</script>
