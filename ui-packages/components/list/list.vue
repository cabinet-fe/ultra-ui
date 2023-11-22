<template>
  <div :class="cls.b">
    <ul v-for="(item, index) in data" :class="cls.e('item')">
      <li>
        <slot name="content">
          <!-- left  -->
          <div :class="cls.e('left')">
            <!-- TODO v-model 值没想好如何处理 -->
            <!-- <div :class="cls.e('checkbox')">
              <input type="radio" v-if="showRadio" v-model="item.checked" />
              <input type="checkbox" v-if="showCheckbox" v-model="item.checked" />
            </div> -->

            <div :clsaa="cls.e('star')"></div>

            <div :class="cls.e('avatar')">
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
          <div :class="cls.e('action')">
            <button @click="handleDelete(item, index)">删除</button>
            <button @click="handleMessage(item, index)">message</button>
            <button @click="handleTip(item, index)">tip</button>

            <u-button size="small" :icon="Delete" @click="handleDelete(item, index)"></u-button>
            <u-button size="small" :icon="Message" @click="handleMessage(item, index)"></u-button>
            <u-button size="small" :icon="Warning" @click="handleTip(item, index)"></u-button>
          </div>
          <!-- action end-->
        </slot>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import type { ActionOptions, DataSourceOptions } from '@ui/types/components/list'
import { UButton } from '../button'
import { Delete, Message, Warning } from 'icon-ultra'
import { bem } from '@ui/utils'
import type { PropType } from 'vue'

defineOptions({
  name: 'List'
})

const emit = defineEmits(['delete', 'message', 'tip'])

const props = defineProps({
  /** 显示单选框 */
  showRadio: {
    type: Boolean,
    default: false
  },

  /** 显示复选框 */
  showCheckbox: {
    type: Boolean,
    defaut: false
  },

  /** 列表数据 */
  data: {
    type: Array as PropType<DataSourceOptions[]>
  },

  /** 操作组 */
  action: {
    type: Array as PropType<ActionOptions[]>,
    defaule: () => []
  }
})

/** 删除 */
const handleDelete = (item: any, index: number) => {
  console.log(item, index)
  emit('delete', item, index)
}
const handleMessage = (item: any, index: number) => {
  console.log(item, index)
  emit('message', item, index)
}
const handleTip = (item: any, index: number) => {
  console.log(item, index)
  emit('tip', item, index)
}

const cls = bem('list')
</script>
