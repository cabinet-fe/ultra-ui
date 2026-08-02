<script setup lang="ts">
import { Down, Left, Right, SortDown, SortLeft, SortRight, SortUp, Up } from '@veltra/icons/normal'
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
  <div class="icons-combo-demo">
    <header class="icons-combo-demo__header">
      <div class="icons-combo-demo__header-inner">
        <div class="icons-combo-demo__brand">
          <h1 class="icons-combo-demo__title">图标组合</h1>
          <p class="icons-combo-demo__subtitle">
            成对使用的图标预览。排序对按设计叠在同一 16×16 单元格内；点击卡片可复制组合用法。
          </p>
        </div>
      </div>
    </header>

    <div class="icons-combo-demo__toolbar">
      <div class="icons-combo-demo__search-wrap">
        <span class="icons-combo-demo__search-icon" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          v-model="query"
          class="icons-combo-demo__search"
          type="search"
          placeholder="Search combinations..."
          autocomplete="off"
          spellcheck="false"
          aria-label="搜索图标组合"
        />
      </div>
      <p class="icons-combo-demo__count">{{ filteredCombos.length }} combinations</p>
    </div>

    <main class="icons-combo-demo__main">
      <div v-if="filteredCombos.length === 0" class="icons-combo-demo__empty">
        没有匹配的图标组合
      </div>
      <ul v-else class="icons-combo-demo__grid">
        <IconComboCell
          v-for="combo in filteredCombos"
          :key="combo.id"
          :combo="combo"
          @toast="showToast"
        />
      </ul>
    </main>

    <Transition name="icons-combo-toast">
      <div v-if="toastMessage" class="icons-combo-demo__toast" role="status">
        {{ toastMessage }}
        <code v-if="toastDetail" class="icons-combo-demo__toast-code">{{ toastDetail }}</code>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.icons-combo-demo {
  color: #171717;
  font-size: 15px;
  line-height: 1.5;
}

.icons-combo-demo__header {
  position: sticky;
  top: 0;
  z-index: 10;
  margin: 0 -24px;
  border-bottom: 1px solid #e5e5e5;
  background: rgba(250, 250, 250, 0.85);
  backdrop-filter: blur(10px);
}

.icons-combo-demo__header-inner {
  padding: 1.25rem 1.5rem 1rem;
}

.icons-combo-demo__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.icons-combo-demo__subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
  color: #737373;
  max-width: 40rem;
}

.icons-combo-demo__toolbar {
  padding: 1rem 0 0.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.icons-combo-demo__search-wrap {
  position: relative;
  flex: 1;
  min-width: min(100%, 280px);
  max-width: 420px;
}

.icons-combo-demo__search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a3a3a3;
  display: flex;
  pointer-events: none;
}

.icons-combo-demo__search {
  width: 100%;
  box-sizing: border-box;
  padding: 0.55rem 0.85rem 0.55rem 2.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background: #fff;
  color: #171717;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.icons-combo-demo__search::placeholder {
  color: #a3a3a3;
}

.icons-combo-demo__search:hover {
  border-color: #d4d4d4;
}

.icons-combo-demo__search:focus {
  border-color: #171717;
  box-shadow: 0 0 0 3px rgba(23, 23, 23, 0.08);
}

.icons-combo-demo__count {
  margin: 0;
  font-size: 0.8125rem;
  color: #737373;
}

.icons-combo-demo__main {
  padding: 0.5rem 0 1.5rem;
}

.icons-combo-demo__empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #737373;
  font-size: 0.9375rem;
}

.icons-combo-demo__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.75rem;
}

.icons-combo-demo__toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  max-width: min(calc(100vw - 2rem), 32rem);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #171717;
  color: #fafafa;
  font-size: 0.8125rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.icons-combo-demo__toast-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 0.7rem;
  opacity: 0.92;
  word-break: break-all;
  white-space: pre-wrap;
}

.icons-combo-toast-enter-active,
.icons-combo-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.icons-combo-toast-enter-from,
.icons-combo-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
