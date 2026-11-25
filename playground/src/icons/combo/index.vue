<script setup lang="ts">
import { UIcon, UInput } from '@veltra/desktop'
import {
  Down,
  Left,
  Right,
  Search,
  SortDown,
  SortLeft,
  SortRight,
  SortUp,
  Up
} from '@veltra/icons/normal'
import { computed, ref, shallowRef } from 'vue'

import IconComboCell from '../icon-combo-cell.vue'
import type { IconCombo } from '../icon-combo-cell.vue'

const iconCombos: IconCombo[] = [
  {
    id: 'sort-horizontal',
    title: '横向排序对',
    description: '表格列头等场景：SortRight（上→）+ SortLeft（下←）叠在同一 16×16 单元格内',
    layout: 'overlay',
    icons: [
      { pascal: 'SortRight', component: SortRight },
      { pascal: 'SortLeft', component: SortLeft }
    ]
  },
  {
    id: 'sort-vertical',
    title: '纵向排序对',
    description: '表格列头等场景：SortUp + SortDown 叠在同一 16×16 单元格内，相互靠拢',
    layout: 'overlay',
    icons: [
      { pascal: 'SortUp', component: SortUp },
      { pascal: 'SortDown', component: SortDown }
    ]
  },
  {
    id: 'arrow-horizontal',
    title: '左右方向对',
    description: 'Left + Right 并排，用于双向导航或展开收起',
    layout: 'row',
    icons: [
      { pascal: 'Left', component: Left },
      { pascal: 'Right', component: Right }
    ]
  },
  {
    id: 'arrow-vertical',
    title: '上下方向对',
    description: 'Up + Down 并排，用于升降序切换旁的方向提示',
    layout: 'row',
    icons: [
      { pascal: 'Up', component: Up },
      { pascal: 'Down', component: Down }
    ]
  }
]

const query = ref('')
const toastMessage = shallowRef('')
const toastDetail = shallowRef('')

let toastTimer: ReturnType<typeof setTimeout> | undefined

const filteredCombos = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return iconCombos
  return iconCombos.filter((combo) => {
    const hay = [combo.title, combo.description, combo.id, ...combo.icons.map((i) => i.pascal)]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

function showToast(message: string, detail?: string) {
  toastMessage.value = message
  toastDetail.value = detail ?? ''
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
    toastDetail.value = ''
  }, 2600)
}
</script>

<template>
  <div class="icons-page">
    <header class="icons-page__header">
      <h1 class="icons-page__title">图标组合</h1>
      <p class="icons-page__subtitle">
        成对使用的图标预览。排序对按设计叠在同一 16×16 单元格内；点击卡片可复制组合用法。
      </p>
    </header>

    <div class="icons-page__toolbar">
      <u-input
        v-model="query"
        class="icons-page__search"
        placeholder="Search combinations..."
        role="search"
        aria-label="搜索图标组合"
        clearable
      >
        <template #prefix>
          <u-icon><Search /></u-icon>
        </template>
      </u-input>
      <p class="icons-page__count">{{ filteredCombos.length }} combinations</p>
    </div>

    <main class="icons-page__main">
      <p v-if="filteredCombos.length === 0" class="icons-page__empty">没有匹配的图标组合</p>
      <ul v-else class="icons-combo-demo__grid">
        <IconComboCell
          v-for="combo in filteredCombos"
          :key="combo.id"
          :combo="combo"
          @toast="showToast"
        />
      </ul>
    </main>

    <Transition name="icons-page-toast">
      <div v-if="toastMessage" class="icons-page__toast" role="status">
        {{ toastMessage }}
        <code v-if="toastDetail" class="icons-page__toast-code">{{ toastDetail }}</code>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.icons-combo-demo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>

<style lang="scss" src="../demo-page.scss"></style>
