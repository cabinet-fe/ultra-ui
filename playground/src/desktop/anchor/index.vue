<template>
  <div>
    <CustomCard title="基础用法（点击定位 + 滚动高亮）">
      <div class="anchor-demo">
        <div ref="basicScroll" class="anchor-demo__scroll">
          <section v-for="section in sections" :id="`basic-${section.id}`" :key="section.id">
            <h4>{{ section.title }}</h4>
            <p v-for="n in 6" :key="n">
              {{ section.title }}第 {{ n }} 段：滚动左侧内容，右侧锚点高亮跟随当前命中区块。
            </p>
          </section>
        </div>

        <u-anchor :container="basicScroll" v-model:current="current">
          <u-anchor-item
            v-for="section in sections"
            :key="section.id"
            :href="`#basic-${section.id}`"
            :title="section.title"
          />
        </u-anchor>
      </div>

      <p class="anchor-demo__tip">当前高亮：{{ current ?? '未命中' }}</p>
    </CustomCard>

    <CustomCard title="定位偏移与事件">
      <div class="anchor-demo">
        <div ref="offsetScroll" class="anchor-demo__scroll">
          <section v-for="section in sections" :id="`offset-${section.id}`" :key="section.id">
            <h4>{{ section.title }}</h4>
            <p v-for="n in 6" :key="n">
              {{ section.title }}第 {{ n }} 段：offset 定位偏移与 change / click-item 事件演示。
            </p>
          </section>
        </div>

        <u-anchor
          :container="offsetScroll"
          :offset="20"
          @change="handleChange"
          @click-item="handleClick"
        >
          <u-anchor-item
            v-for="section in sections"
            :key="section.id"
            :href="`#offset-${section.id}`"
            :title="section.title"
          />
        </u-anchor>
      </div>

      <p class="anchor-demo__tip">事件日志（最近 3 条）：{{ logs.join('；') || '无' }}</p>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const sections = [
  { id: 'overview', title: '概述' },
  { id: 'install', title: '安装' },
  { id: 'quick-start', title: '快速上手' },
  { id: 'api', title: 'API 说明' },
  { id: 'faq', title: '常见问题' }
]

const basicScroll = useTemplateRef('basicScroll')
const offsetScroll = useTemplateRef('offsetScroll')

const current = shallowRef<string>()

const logs = shallowRef<string[]>([])

function log(message: string) {
  logs.value = [...logs.value, message].slice(-3)
}

function handleChange(href: string) {
  log(`change：${href}`)
}

function handleClick(href: string) {
  log(`click-item：${href}`)
}
</script>

<style scoped>
.anchor-demo {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.anchor-demo__scroll {
  flex: 1;
  min-width: 0;
  height: 300px;
  overflow-y: auto;
}

.anchor-demo__tip {
  margin: 12px 0 0;
  font-size: 13px;
}
</style>
