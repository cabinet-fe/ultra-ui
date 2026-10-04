<template>
  <div class="demo">
    <section>
      <h3>类型</h3>
      <div class="row">
        <UTag>默认</UTag>
        <UTag v-for="tag of typedTags" :key="tag.type" :type="tag.type">
          {{ tag.text }}
        </UTag>
      </div>
    </section>

    <section>
      <h3>深色</h3>
      <div class="row">
        <UTag dark>默认</UTag>
        <UTag v-for="tag of typedTags" :key="tag.type" :type="tag.type" dark>
          {{ tag.text }}
        </UTag>
      </div>
    </section>

    <section>
      <h3>可移除（触控热区已扩至 44×44）</h3>
      <div class="row">
        <UTag
          v-for="(tag, index) in tags"
          :key="tag.name"
          :type="tag.type"
          closable
          @close="handleClose(index)"
        >
          {{ tag.name }}
        </UTag>
        <UButton v-if="tags.length < 6" size="small" @click="reset">恢复</UButton>
      </div>
    </section>

    <section>
      <h3>尺寸</h3>
      <div class="row">
        <UTag size="small">small</UTag>
        <UTag size="default">default</UTag>
        <UTag size="large">large</UTag>
      </div>
    </section>

    <section>
      <h3>圆角标签</h3>
      <div class="row">
        <UTag v-for="tag of typedTags" :key="tag.type" :type="tag.type" round>
          {{ tag.text }}
        </UTag>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UTag } from '@veltra/mobile'
import type { ColorType } from '@veltra/utils'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/tag/style'

const typedTags: Array<{ type: ColorType; text: string }> = [
  { type: 'primary', text: '主题' },
  { type: 'success', text: '成功' },
  { type: 'warning', text: '警告' },
  { type: 'danger', text: '危险' },
  { type: 'info', text: '信息' }
]

const initialTags: Array<{ name: string; type?: ColorType }> = [
  { name: '默认' },
  { name: '标签 1', type: 'primary' },
  { name: '标签 2', type: 'success' },
  { name: '标签 3', type: 'info' },
  { name: '标签 4', type: 'warning' },
  { name: '标签 5', type: 'danger' }
]

const tags = shallowRef(initialTags)

const handleClose = (index: number) => {
  tags.value = tags.value.filter((_, i) => i !== index)
}

const reset = () => {
  tags.value = initialTags
}
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
</style>
