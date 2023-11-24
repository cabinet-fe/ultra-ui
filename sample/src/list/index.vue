<template>
  <div class="list-box">
    <h2>List 列表</h2>

    <div class="list-row">
      <h3>基础列表</h3>
      <u-list :data="list" />
    </div>

    <div class="list-row">
      <h3>显示单选框列表</h3>
      <p>可以通过属性<span class="tip">show-check</span>显示，默认false</p>
      {{ checkArr }}
      <u-list :data="list2" :show-check="true" v-model:check="checkArr" />
    </div>

    <div class="list-row">
      <h3>带操作按钮列表</h3>

      <p>可以通过属性<span class="tip">show-actions</span>显示，默认false;</p>

      <u-list
        :data="list"
        :show-actions="true"
        @delete="handleDelete"
        @message="handleMessage"
        @tip="handleTip"
        :show-radio="true"
      >
      </u-list>
    </div>

    <!-- API  -->
    <ul class="tip-ul">
      <li>
        <div>参数</div>
        <div>说明</div>
        <div>类型</div>
        <div>默认值</div>
      </li>
      <li v-for="item in attributeList">
        <div class="parameter">{{ item.parameter }}</div>
        <div class="explain">{{ item.explain }}</div>
        <div class="type">{{ item.type }}</div>
        <div class="defaultValue">{{ item.defaultValue }}</div>
      </li>
    </ul>

    <ul class="tip-ul">
      <li>
        <div>事件名</div>
        <div>说明</div>
        <div>类型</div>
      </li>
      <li v-for="item in eventList">
        <div class="parameter">{{ item.parameter }}</div>
        <div class="explain">{{ item.explain }}</div>
        <div class="type">{{ item.type }}</div>
      </li>
    </ul>
    <!-- API end  -->
  </div>
</template>

<script lang="ts" setup>
import { ref } from '@vue/runtime-core'
import { reactive } from 'vue'

const checkArr = ref([])

const list = reactive([
  {
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    title: '基础列表1',
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后'
  },
  {
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    title: '基础列表2',
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后'
  },
  {
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    title: '基础列表3',
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后'
  }
])

const list2 = reactive([
  {
    checked: false,
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    title: '显示单选框列表1',
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后'
  },
  {
    checked: false,
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    title: '显示单选框列表2',
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后'
  },
  {
    checked: false,
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    title: '显示单选框列表3',
    desc: '判定目标节点能否成为拖动目标位置。 如果返回 false ，拖动节点不能被拖放到目标节点。 type 参数有三种情况："prev"、"inner" 和 "next"分别表示放置在目标节点前、插入至目标节点和放置在目标节点后'
  }
])

/** 属性 */
const attributeList = [
  { parameter: 'data', explain: '数据源', type: 'Array', defaultValue: '[]' },
  {
    parameter: 'show-check',
    explain: '是否显示单选框/复选框',
    type: 'boolean',
    defaultValue: 'false'
  },
  {
    parameter: 'show-actions',
    explain: '是否显示操作按钮',
    type: 'boolean',
    defaultValue: 'false'
  }
]

/** 事件名 */
const eventList = [
  { parameter: 'delete', explain: '删除', type: 'Function' },
  { parameter: 'message', explain: '消息', type: 'Function' },
  { parameter: 'tip', explain: '提示信息', type: 'Function' }
]

/** checked事件 */
const handleUpdate = (val: any, index: number) => {
  console.log(val, index)
}

const handleDelete = (val: any, index: number) => {
  console.log(val, index)
  list.splice(index, 1)
}

const handleMessage = (val: any, index: number) => {
  console.log(val, index)
}

const handleTip = (val: any, index: number) => {
  console.log(val, index)
}
</script>

<style lang="scss" scoped>
.list-row {
  padding: 10px;
  border-radius: 5px;
  border: 1px solid var(--u-color-info-light-7);
  margin-bottom: 15px;
}
.tip {
  color: var(--u-color-primary-light-1);
  display: inline-block;
  padding: 3px;
  box-sizing: border-box;
  border: 1px solid var(--u-color-primary-light-7);
  margin: 0 3px;
  border-radius: 5px;
}
.tip-ul {
  margin: 20px 0;
  border: 1px solid var(--u-border-color);
  & > li {
    border-bottom: 1px solid var(--u-border-color);
    display: flex;
    & > div {
      flex: 1;
      padding: 10px;
      padding-right: 1px solid var(--u-border-color);
    }
  }
  & > li:first-child {
    & > div {
      font-weight: bold;
      font-size: 16px;
    }
  }
  & > li:last-child {
    border-bottom: none;
  }
  .parameter {
    font-weight: bold;
  }
  .type {
    color: var(--u-color-primary-light-1);
  }
}
</style>
