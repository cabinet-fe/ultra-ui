<template>
  <div>
    <div style="height: 80vh">
      <u-radio-group :items="items" v-model="trigger" />

      <CustomCard title="虚拟触发">
        <div>
          <u-button
            @mouseenter="
              dropdownRef?.open({ virtual: spanRef, real: $event.target })
            "
            @mouseleave="dropdownRef?.close()"
          >
            浮动触发离开关闭
          </u-button>
        </div>

        <br />

        <div>
          <u-button @click="handleClickTrigger" style="margin-right: 10px">
            点击触发
          </u-button>
        </div>

        <br />

        <div>
          <span ref="spanRef">触发位置</span>
        </div>

        <u-dropdown
          class="bb"
          width="200px"
          ref="dropdownRef"
          :trigger="trigger"
        >
          <template #content>
            <ul>
              <li>第一层hover第一层hover第一层hover第一层hover第一层hover</li>
              <li>第二层hover</li>
              <li>第三层hover</li>
              <li>第四层hover</li>
              <li>第五层hover</li>
              <li>第六层hover</li>
            </ul>
          </template>
        </u-dropdown>
      </CustomCard>
    </div>

    <div style="display: flex; justify-content: right">
      <u-dropdown :trigger="trigger" class="bb" width="200px">
        <template #trigger>
          <u-button>dropdown-hover</u-button>
        </template>

        <template #content>
          <ul>
            <li>第一层hover第一层hover第一层hover第一层hover第一层hover</li>
            <li>第二层hover</li>
            <li>第三层hover</li>
            <li>第四层hover</li>
            <li>第五层hover</li>
            <li>第六层hover</li>
          </ul>
        </template>
      </u-dropdown>
    </div>

    <div style="height: 80vh"></div>
  </div>
</template>

<script setup lang="ts">
import type { DropdownExposed } from 'ultra-ui'
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'

const items = [
  { label: '浮动', value: 'hover' },
  { label: '点击', value: 'click' }
]

const trigger = shallowRef<'hover' | 'click'>('hover')

const dropdownRef = shallowRef<DropdownExposed>()

const spanRef = shallowRef<HTMLSpanElement>()

function handleClickTrigger(e: MouseEvent) {
  dropdownRef.value?.open({
    virtual: spanRef.value,
    real: e.target as HTMLElement
  })
}
</script>
