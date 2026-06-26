<script setup lang="ts">
import * as ColorfulIcons from '@veltra/icons/colorful'
import * as NormalIcons from '@veltra/icons/normal'
import { computed, ref, shallowRef, watch } from 'vue'
import type { Component } from 'vue'

import IconCell from './icon-cell.vue'
import type { IconItem, IconSetKey } from './icon-cell.vue'

type SetKey = IconSetKey

function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function collectIcons(ns: Record<string, unknown>): IconItem[] {
  const out: IconItem[] = []
  for (const [key, value] of Object.entries(ns)) {
    if (key === 'default' || key.startsWith('_')) continue
    if (typeof value !== 'object' || value === null) continue
    out.push({ pascal: key, kebab: pascalToKebab(key), component: value as Component })
  }
  out.sort((a, b) => a.kebab.localeCompare(b.kebab))
  return out
}

const sets: Record<SetKey, IconItem[]> = {
  normal: collectIcons(NormalIcons as Record<string, unknown>),
  colorful: collectIcons(ColorfulIcons as Record<string, unknown>)
}

const activeSet = ref<SetKey>('normal')
const query = ref('')
const toastMessage = shallowRef('')
const toastDetail = shallowRef('')

let toastTimer: ReturnType<typeof setTimeout> | undefined

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = sets[activeSet.value]
  if (!q) return list
  return list.filter((i) => i.kebab.includes(q) || i.pascal.toLowerCase().includes(q))
})

watch(activeSet, () => {
  query.value = ''
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

// Normal icons grouping configuration
const NORMAL_GROUPS_CONFIG = [
  {
    name: '表单控件图标',
    description: '用于表单设计器或低代码平台中，代表各个控件本身的图标',
    isHot: true,
    matches: [
      'Form',
      'Input',
      'Textarea',
      'PasswordInput',
      'NumberInput',
      'NumberRangeInput',
      'Select',
      'MultiSelect',
      'Cascader',
      'TreeSelect',
      'MultiTreeSelect',
      'DatePicker',
      'DateRangePicker',
      'Slider',
      'Switch',
      'Checkbox',
      'Radio',
      'Table',
      'AutoComplete',
      'FilePicker'
    ]
  },
  {
    name: '方向与导航',
    description: '各种方向指示、箭头、排序、拉伸及位置对齐图标',
    isHot: false,
    matches: [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUpdown',
      'CaretTop',
      'CaretBottom',
      'CaretLeft',
      'CaretRight',
      'DArrowLeft',
      'DArrowRight',
      'Left',
      'Right',
      'Bottom',
      'Backtop',
      'PageFirst',
      'PageLast',
      'Sort',
      'SortLeft',
      'SortRight',
      'Rollback',
      'Rollfront',
      'Move',
      'MoveHorizontal',
      'Rotation',
      'RotateLeft',
      'RotateRight',
      'AlignTop',
      'AlignBottom',
      'AlignCenter',
      'VerticalAlignCenter',
      'VerticalAlignLeft',
      'VerticalAlignRight'
    ]
  },
  {
    name: '常规操作与状态',
    description: '按钮、对话框、提示信息等常用的交互反馈及业务操作图标',
    isHot: false,
    matches: [
      'Search',
      'Clear',
      'Close',
      'Plus',
      'Minus',
      'Check',
      'Remove',
      'Delete',
      'Edit',
      'EditPen',
      'Save',
      'Copy',
      'Download',
      'Upload',
      'CloudDownload',
      'History',
      'Refresh',
      'Loading',
      'ZoomIn',
      'ZoomOut',
      'Enter',
      'Lock',
      'Unlock',
      'Login',
      'Logout',
      'Poweroff',
      'Secured',
      'View',
      'Hide',
      'AddChild',
      'CircleCheck',
      'CircleCheckFilled',
      'CircleClose',
      'CirclePlus',
      'InfoCircle',
      'InfoFilled',
      'Warning',
      'WarningFilled',
      'TriangleAlert',
      'QuestionFilled',
      'Help',
      'Dot',
      'MoreFilled',
      'MoreVertical'
    ]
  },
  {
    name: '实体与数据',
    description: '数据库、多媒体、金融、系统组件、文件管理等数据类型图标',
    isHot: false,
    matches: [
      'Database',
      'Server',
      'Variable',
      'Setting',
      'Tools',
      'Monitor',
      'Mobile',
      'PictureRounded',
      'Wallet',
      'CreditCard',
      'Discount',
      'MoneyCircle',
      'QrCode',
      'Scan',
      'ChartPie',
      'Layers',
      'Books',
      'Calendar',
      'Time',
      'Folder',
      'FolderAdd',
      'FolderOpened',
      'FileAdd',
      'Attach',
      'Link',
      'Unlink',
      'List',
      'Queue',
      'Printer',
      'Location',
      'Empty'
    ]
  },
  {
    name: '社交与通讯',
    description: '用户管理、通讯、群组、天气、星级等社交属性图标',
    isHot: false,
    matches: [
      'User',
      'UserAdd',
      'UserClear',
      'UserCircle',
      'UserGroup',
      'UserGroupAdd',
      'UserGroupClear',
      'Bell',
      'BellFilled',
      'Message',
      'Horn',
      'Service',
      'Share',
      'Call',
      'Internet',
      'DeepThinking',
      'Flag',
      'Star',
      'StarFilled',
      'Sun',
      'Moon',
      'Cloudy',
      'MostlyCloudy'
    ]
  }
]

interface GroupedResult {
  name: string
  description?: string
  isHot?: boolean
  items: IconItem[]
}

const groupedNormalIcons = computed<GroupedResult[]>(() => {
  const list = filtered.value
  if (activeSet.value !== 'normal') return []

  const categorizedSet = new Set<string>()
  const groups: GroupedResult[] = NORMAL_GROUPS_CONFIG.map((cfg) => {
    const items = list.filter((item) => {
      const isMatched = cfg.matches.includes(item.pascal)
      if (isMatched) categorizedSet.add(item.pascal)
      return isMatched
    })
    return { name: cfg.name, description: cfg.description, isHot: cfg.isHot, items }
  }).filter((g) => g.items.length > 0)

  const otherItems = list.filter((item) => !categorizedSet.has(item.pascal))
  if (otherItems.length > 0) {
    groups.push({
      name: '其他图标',
      description: '通用业务与尚未分类的图标组件',
      items: otherItems
    })
  }

  return groups
})
</script>

<template>
  <div class="icons-demo">
    <header class="icons-demo__header">
      <div class="icons-demo__header-inner">
        <div class="icons-demo__brand">
          <h1 class="icons-demo__title">Ultra Icons</h1>
          <p class="icons-demo__subtitle">
            来自 <code>@veltra/icons</code> 的 Vue
            图标组件，点击卡片或复制按钮获取组件代码，悬停可下载 SVG。
          </p>
        </div>
        <div class="icons-demo__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="activeSet === 'normal'"
            class="icons-demo__tab"
            :class="{ 'icons-demo__tab--active': activeSet === 'normal' }"
            @click="activeSet = 'normal'"
          >
            Normal
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeSet === 'colorful'"
            class="icons-demo__tab"
            :class="{ 'icons-demo__tab--active': activeSet === 'colorful' }"
            @click="activeSet = 'colorful'"
          >
            Colorful
          </button>
        </div>
      </div>
    </header>

    <div class="icons-demo__toolbar">
      <div class="icons-demo__search-wrap">
        <span class="icons-demo__search-icon" aria-hidden="true">
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
          class="icons-demo__search"
          type="search"
          placeholder="Search icons..."
          autocomplete="off"
          spellcheck="false"
          aria-label="搜索图标"
        />
      </div>
      <p class="icons-demo__count">{{ filtered.length }} icons</p>
    </div>

    <main class="icons-demo__main">
      <div v-if="filtered.length === 0" class="icons-demo__empty">没有匹配的图标</div>

      <template v-else-if="activeSet === 'normal'">
        <div
          v-for="group in groupedNormalIcons"
          :key="group.name"
          class="icons-demo__group"
          :class="{ 'icons-demo__group--hot': group.isHot }"
        >
          <div class="icons-demo__group-header">
            <div class="icons-demo__group-title-row">
              <span v-if="group.isHot" class="icons-demo__group-badge">NEW</span>
              <h2 class="icons-demo__group-title">{{ group.name }}</h2>
            </div>
            <p v-if="group.description" class="icons-demo__group-desc">{{ group.description }}</p>
          </div>

          <ul class="icons-demo__grid">
            <IconCell
              v-for="item in group.items"
              :key="item.kebab"
              :item="item"
              :active-set="activeSet"
              @toast="showToast"
            />
          </ul>
        </div>
      </template>

      <ul v-else class="icons-demo__grid">
        <IconCell
          v-for="item in filtered"
          :key="item.kebab"
          :item="item"
          :active-set="activeSet"
          @toast="showToast"
        />
      </ul>
    </main>

    <Transition name="icons-demo-toast">
      <div v-if="toastMessage" class="icons-demo__toast" role="status">
        {{ toastMessage }}
        <code v-if="toastDetail" class="icons-demo__toast-code">{{ toastDetail }}</code>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.icons-demo {
  color: #171717;
  font-size: 15px;
  line-height: 1.5;
}

.icons-demo__header {
  position: sticky;
  top: 0;
  z-index: 10;
  /* 仅水平负边距抵消 content-container padding，避免 margin-top 负值导致搜索栏与 header 重叠 */
  margin: 0 -24px;
  border-bottom: 1px solid #e5e5e5;
  background: rgba(250, 250, 250, 0.85);
  backdrop-filter: blur(10px);
}

.icons-demo__header-inner {
  padding: 1.25rem 1.5rem 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.icons-demo__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.icons-demo__subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
  color: #737373;
  max-width: 36rem;
}

.icons-demo__subtitle code {
  font-size: 0.8125rem;
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: #f0f0f0;
  color: #404040;
}

.icons-demo__tabs {
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  background: #ececec;
  gap: 2px;
}

.icons-demo__tab {
  border: none;
  margin: 0;
  padding: 0.45rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: inherit;
  border-radius: 8px;
  background: transparent;
  color: #525252;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.icons-demo__tab:hover {
  color: #171717;
}

.icons-demo__tab--active {
  background: #fff;
  color: #171717;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.icons-demo__toolbar {
  padding: 1rem 0 0.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.icons-demo__search-wrap {
  position: relative;
  flex: 1;
  min-width: min(100%, 280px);
  max-width: 420px;
}

.icons-demo__search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a3a3a3;
  display: flex;
  pointer-events: none;
}

.icons-demo__search {
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

.icons-demo__search::placeholder {
  color: #a3a3a3;
}

.icons-demo__search:hover {
  border-color: #d4d4d4;
}

.icons-demo__search:focus {
  border-color: #171717;
  box-shadow: 0 0 0 3px rgba(23, 23, 23, 0.08);
}

.icons-demo__count {
  margin: 0;
  font-size: 0.8125rem;
  color: #737373;
}

.icons-demo__main {
  padding: 0.5rem 0 1.5rem;
}

.icons-demo__group {
  margin-bottom: 2.5rem;
  padding: 1.75rem;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  background: #fff;
  transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.icons-demo__group:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.03);
}

.icons-demo__group--hot {
  border-color: rgba(59, 130, 246, 0.25);
  background: linear-gradient(180deg, #fbfcfd 0%, #ffffff 100%);
}

.icons-demo__group-header {
  margin-bottom: 1.25rem;
}

.icons-demo__group-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icons-demo__group-badge {
  font-size: 0.625rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.icons-demo__group-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #171717;
}

.icons-demo__group-desc {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: #737373;
}

.icons-demo__empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #737373;
  font-size: 0.9375rem;
}

.icons-demo__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.75rem, 1fr));
  gap: 0.5rem;
}

.icons-demo__toast {
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

.icons-demo__toast-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 0.7rem;
  opacity: 0.92;
  word-break: break-all;
  white-space: pre-wrap;
}

.icons-demo-toast-enter-active,
.icons-demo-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.icons-demo-toast-enter-from,
.icons-demo-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
