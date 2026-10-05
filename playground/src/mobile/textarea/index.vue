<template>
  <div class="demo">
    <section>
      <h3>基础</h3>
      <UTextarea v-model="text" placeholder="请输入多行内容" :rows="3" />
    </section>

    <section>
      <h3>自适应高度</h3>
      <UTextarea v-model="autosizeText" autosize placeholder="内容增多时自动长高" />
    </section>

    <section>
      <h3>字数统计</h3>
      <UTextarea
        v-model="countText"
        :maxlength="50"
        show-count
        placeholder="最多 50 字，超长自动截断"
      />
      <p class="tip">计数为「当前字数/最大字数」，展示在文本域右下角</p>
    </section>

    <section>
      <h3>嵌入表单行（label 上方）</h3>
      <UFormItem label="留言" label-position="top">
        <UTextarea v-model="rowText" :rows="2" placeholder="长控件建议 label-position 为 top" />
      </UFormItem>
    </section>

    <section>
      <h3>状态</h3>
      <UTextarea model-value="禁用状态的内容" disabled :rows="2" />
      <UTextarea model-value="只读状态的内容" readonly :rows="2" />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UFormItem, UTextarea } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/form-item/style'
import '@veltra/mobile/components/textarea/style'

const text = shallowRef('')
const autosizeText = shallowRef('')
const countText = shallowRef('')
const rowText = shallowRef('')
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度与触控热区
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

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
