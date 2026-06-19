<template>
  <div>
    <CustomCard title="基础">
      <u-breadcrumb :items="basicItems" @click="onClick" />
      <p v-if="msg" :style="{ marginTop: '12px', fontSize: '13px' }">{{ msg }}</p>
    </CustomCard>

    <CustomCard title="自定义分隔符">
      <u-breadcrumb :items="basicItems">
        <template #separator>
          <u-icon :size="14"><ArrowRight /></u-icon>
        </template>
      </u-breadcrumb>
    </CustomCard>

    <CustomCard title="末级为链接（lastLinked + href）">
      <u-breadcrumb last-linked :items="linkedLastItems" />
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@veltra/desktop'
import { ArrowRight } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const basicItems: BreadcrumbItem[] = [
  { title: '首页', href: '#/' },
  { title: '导航' },
  { title: '面包屑' }
]

const linkedLastItems: BreadcrumbItem[] = [
  { title: '文档', href: '#/layout/index' },
  { title: '组件', href: '#/desktop/button/index' },
  { title: '当前页', href: '#/breadcrumb/index' }
]

const msg = shallowRef('')

const onClick = (_item: BreadcrumbItem, index: number) => {
  msg.value = `点击了索引 ${index}（无 href 的项可走 SPA 路由）`
}
</script>
