<template>
  <div class="demo">
    <section>
      <h3>基本用法（热区不小于 44×44）</h3>
      <div class="row">
        <UCheckTag v-model="checked">标签</UCheckTag>
        <span class="state">{{ checked ? '已选中' : '未选中' }}</span>
      </div>
    </section>

    <section>
      <h3>多选标签</h3>
      <div class="row">
        <UCheckTag v-for="item in skills" :key="item.name" v-model="item.checked">
          {{ item.name }}
        </UCheckTag>
      </div>
      <p class="state">已选：{{ selectedText || '无' }}</p>
    </section>

    <section>
      <h3>非受控形态（checked）</h3>
      <div class="row">
        <UCheckTag checked>默认选中</UCheckTag>
        <UCheckTag>默认未选中</UCheckTag>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UCheckTag } from '@veltra/mobile'
import { computed, reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/check-tag/style'

const checked = shallowRef(true)

const skills = reactive([
  { name: 'Vue', checked: true },
  { name: 'TypeScript', checked: false },
  { name: 'Vite', checked: true },
  { name: 'Vitest', checked: false },
  { name: 'Sass', checked: false }
])

const selectedText = computed(() =>
  skills
    .filter((s) => s.checked)
    .map((s) => s.name)
    .join('、')
)
</script>

<style lang="scss" scoped>
// 375px 手机视口宽度内呈现
.demo {
  max-width: 375px;
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
  gap: 12px;
}

.state {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
