<template>
  <div class="icon-demo">
    <p class="icon-demo__intro">
      <code>UIcon</code> 是图标容器，通过 <code>size</code> 控制尺寸，颜色继承父元素的
      <code>color</code>。
      <RouterLink class="icon-demo__link" to="/icons/index">查看全部图标 →</RouterLink>
    </p>

    <u-card class="mb-2">
      <u-card-header>配置选项</u-card-header>

      <u-card-content>
        <u-form :model="config" no-tips :cols="4">
          <u-number-input
            field="size"
            label="尺寸 (px)"
            :min="12"
            :max="96"
            :step="2"
            :clearable="false"
          />
          <u-select field="color" label="颜色" :options="colorOptions" :clearable="false" />
          <u-checkbox field="loading" label="加载动画" />
        </u-form>
      </u-card-content>
    </u-card>

    <u-card>
      <u-card-header>预览</u-card-header>

      <u-card-content>
        <div class="icon-demo__preview" :style="{ color: config.color }">
          <u-icon :size="config.size" :class="{ 'u-icon--loading': config.loading }">
            <Search />
          </u-icon>
        </div>

        <div class="icon-demo__slider">
          <span class="icon-demo__slider-label">尺寸</span>
          <u-slider v-model="config.size" :min="12" :max="96" :step="2" />
          <span class="icon-demo__slider-value">{{ config.size }}px</span>
        </div>

        <pre class="icon-demo__code">{{ codeSnippet }}</pre>
      </u-card-content>
    </u-card>
  </div>
</template>

<script lang="ts" setup>
import { Search } from '@veltra/icons/normal'
import { computed, reactive } from 'vue'

const colorOptions = [
  { label: '默认', value: '#475569' },
  { label: '主题', value: '#3b82f6' },
  { label: '成功', value: '#22c55e' },
  { label: '警告', value: '#f59e0b' },
  { label: '危险', value: '#ef4444' }
]

const config = reactive({ size: 32, color: '#3b82f6', loading: false })

const codeSnippet = computed(() => {
  const lines = [`import { Search } from '@veltra/icons/normal'`, '']

  const attrs = [`:size="${config.size}"`]
  if (config.loading) attrs.push('class="u-icon--loading"')

  lines.push(`<div style="color: ${config.color}">`)
  lines.push(`  <u-icon ${attrs.join(' ')}>`)
  lines.push('    <Search />')
  lines.push('  </u-icon>')
  lines.push('</div>')

  return lines.join('\n')
})
</script>

<style lang="scss" scoped>
.icon-demo {
  &__intro {
    margin: 0 0 16px;
    font-size: 14px;
    color: #64748b;
    line-height: 1.6;

    code {
      padding: 1px 4px;
      border-radius: 4px;
      background: #f1f5f9;
      font-size: 13px;
    }
  }

  &__link {
    margin-left: 8px;
    color: #3b82f6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__preview {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    margin-bottom: 20px;
    border: 1px dashed #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
  }

  &__slider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__slider-label {
    flex-shrink: 0;
    width: 36px;
    font-size: 13px;
    color: #64748b;
  }

  &__slider-value {
    flex-shrink: 0;
    width: 48px;
    font-size: 13px;
    color: #475569;
    text-align: right;
  }

  &__code {
    margin: 0;
    padding: 12px 16px;
    border-radius: 8px;
    background: #0f172a;
    color: #e2e8f0;
    font-size: 13px;
    line-height: 1.6;
    overflow-x: auto;
  }
}

.mb-2 {
  margin-bottom: 16px;
}
</style>
