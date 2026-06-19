<template>
  <div class="demo">
    <p class="demo__hint">悬停到有内容的输入框时会出现清除按钮；清除与显示/隐藏应可同时操作。</p>

    <div class="demo__row">
      <span class="demo__label">基础</span>
      <u-password-input v-model="password" placeholder="请输入密码" style="width: 280px" />
    </div>

    <div class="demo__row">
      <span class="demo__label">可清空</span>
      <u-password-input
        v-model="passwordClearable"
        clearable
        placeholder="悬停显示清除，右侧切换明文"
        style="width: 280px"
      />
    </div>

    <div class="demo__row">
      <span class="demo__label">禁用</span>
      <u-password-input
        v-model="passwordDisabled"
        clearable
        disabled
        placeholder="禁用状态"
        style="width: 280px"
      />
    </div>

    <div class="demo__values">
      <div>基础值: {{ password || '（空）' }}</div>
      <div>可清空值: {{ passwordClearable || '（空）' }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const password = shallowRef('secret')
const passwordClearable = shallowRef('abc123')
const passwordDisabled = shallowRef('locked')
</script>

<style scoped>
.demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo__hint {
  margin: 0;
  color: var(--u-text-color-secondary, #666);
  font-size: 14px;
}

.demo__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.demo__label {
  flex-shrink: 0;
  width: 56px;
  font-size: 14px;
}

.demo__values {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.8;
}
</style>
