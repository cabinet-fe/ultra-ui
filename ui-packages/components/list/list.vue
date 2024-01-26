<template>
  <div :class="cls.b">
    <ul :class="cls.e('item')">
      <li
        v-for="(item, index) in visibleItems"
        :draggable="props.draggable"
        @dragstart="onDragStart"
        @dragover.prevent="onDragOver"
        @drop="onDrop($event, index)"
        @dragend="onDragEnd"
      >
        <slot name="content" v-if="$slots.content" :item="item" :index="index" />

        <div v-else :class="cls.e('list')">
          <!-- left  -->
          <div :class="cls.e('left')">
            <!-- TODO v-model 值有点问题 -->
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
            <u-icon :size="16"><Delete @click="handleDelete(item, index)" /></u-icon>
            <u-icon :size="16"><Message @click="handleMessage(item, index)" /></u-icon>
            <u-icon :size="16"><Warning @click="handleTip(item, index)" /></u-icon>
          </div>
          <!-- action end-->
        </div>
      </li>
    </ul>

    <!-- 加载更多 -->
    <div :class="cls.e('loadMore')">
      <u-button @click="loadMore" v-if="props.showLoadMore && showLoadMoreButton">
        加载更多
      </u-button>
    </div>
    <!-- 加载更多 end -->
  </div>
</template>

<script lang="ts" setup>
import { type ListProps, type ListEmits } from '@ui/types/components/list'
import { UIcon } from '../icon'
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
  itemsPerPage: 10
})

/** 是否拖拽 */
// let draggable = ref(true)

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
const loadMore = () => {
  currentPage.value++
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

const onDragStart = (event: DragEvent) => {
  console.log(event, 'onDragStart')
  event.dataTransfer?.setData('drag_text', (event.target as HTMLElement).innerHTML)
}

const onDragOver = (event: DragEvent) => {
  console.log(event, 'onDragOver')
  event.preventDefault()
}
const onDrop = (event: DragEvent, index: number) => {
  event.preventDefault()

  listText.value = (event.target as HTMLElement).innerHTML
  console.log(listText.value, 'listText.value')

  const dragText = event.dataTransfer?.getData('drag_text')

  if (dragText !== undefined) {
    visibleItems.value.splice(index, 1, dragText)
  }
}
const onDragEnd = (event: DragEvent) => {
  event.preventDefault()

  const index = visibleItems.value.indexOf(listText.value)
  console.log(index)

  if (index !== -1) {
    visibleItems.value.splice(index, 1, listText.value)
    console.log(visibleItems.value, 'if-index-1')
  }
}
</script>
