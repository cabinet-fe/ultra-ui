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
    </section>

    <section>
      <h3>状态</h3>
      <UTextarea model-value="禁用状态的内容" disabled :rows="2" />
      <UTextarea model-value="只读状态的内容" readonly :rows="2" />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UTextarea } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/textarea/style'

const text = shallowRef('')
const autosizeText = shallowRef('')
const countText = shallowRef('')
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
