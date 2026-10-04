<template>
  <div class="demo">
    <section>
      <h3>基本用法</h3>
      <div class="row">
        <UIcon><Search /></UIcon>
        <UIcon><Bell /></UIcon>
        <UIcon><Setting /></UIcon>
        <UIcon><User /></UIcon>
        <UIcon><Star /></UIcon>
        <UIcon><Delete /></UIcon>
      </div>
    </section>

    <section>
      <h3>尺寸</h3>
      <div class="row row-align-end">
        <UIcon v-for="size in sizes" :key="size" :size="size">
          <Search />
        </UIcon>
        <UIcon size="48px">
          <Search />
        </UIcon>
      </div>
    </section>

    <section>
      <h3>颜色继承</h3>
      <div class="row">
        <span class="tone-primary"
          ><UIcon :size="24"><Search /></UIcon
        ></span>
        <span class="tone-success"
          ><UIcon :size="24"><Check /></UIcon
        ></span>
        <span class="tone-warning"
          ><UIcon :size="24"><Bell /></UIcon
        ></span>
        <span class="tone-danger"
          ><UIcon :size="24"><Delete /></UIcon
        ></span>
      </div>
    </section>

    <section>
      <h3>加载动画</h3>
      <div class="row">
        <UIcon :size="24" :class="{ 'is-loading': loading }">
          <Setting />
        </UIcon>
        <UButton size="small" @click="loading = !loading">切换动画</UButton>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { Bell, Check, Delete, Search, Setting, Star, User } from '@veltra/icons/normal'
import { UIcon, UButton } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/icon/style'

const sizes = [12, 16, 20, 28, 36]

const loading = shallowRef(true)
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
  gap: 8px 16px;
}

.row-align-end {
  align-items: flex-end;
}

// 颜色经主题 token 继承给 UIcon（currentColor）
.tone-primary {
  color: var(--u-color-primary);
}

.tone-success {
  color: var(--u-color-success);
}

.tone-warning {
  color: var(--u-color-warning);
}

.tone-danger {
  color: var(--u-color-danger);
}
</style>
