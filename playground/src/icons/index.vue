<script setup lang="ts">
import { UIcon, UInput, USegment } from '@veltra/desktop'
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

const SET_OPTIONS: { label: string; value: SetKey }[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Colorful', value: 'colorful' }
]

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

const NORMAL_GROUPS_CONFIG = [
  {
    name: '表单控件图标',
    description: '用于表单设计器或低代码平台中，代表各个控件本身的图标',
    isHot: true,
    matches: [
      'FormContainer',
      'FormInput',
      'FormTextarea',
      'FormPasswordInput',
      'FormNumberInput',
      'FormNumberRangeInput',
      'FormSelect',
      'FormMultiSelect',
      'FormCascader',
      'FormTreeSelect',
      'FormMultiTreeSelect',
      'FormDatePicker',
      'FormDateRangePicker',
      'FormSlider',
      'FormSwitch',
      'FormCheckbox',
      'FormRadio',
      'FormTable',
      'FormAutoComplete',
      'FormFilePicker'
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
      'Up',
      'Down',
      'Backtop',
      'PageFirst',
      'PageLast',
      'Sort',
      'SortLeft',
      'SortRight',
      'SortUp',
      'SortDown',
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
      'Empty',
      'Process',
      'Code',
      'GitBranch',
      'Key',
      'Terminal',
      'Token',
      'Build',
      'Checklist',
      'Role'
    ]
  },
  {
    name: 'AI',
    description: '智能体、技能、模型、提示词等 AI 相关图标',
    isHot: true,
    matches: ['Agent', 'Skill', 'Sparkles', 'AiChat', 'Model', 'Prompt', 'Brain', 'DeepThinking']
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
  <div class="icons-page">
    <header class="icons-page__header">
      <h1 class="icons-page__title">Ultra Icons</h1>
      <p class="icons-page__subtitle">
        来自 <code>@veltra/icons</code> 的 Vue 图标组件，点击卡片或复制按钮获取组件代码，悬停可下载
        SVG。
      </p>
    </header>

    <div class="icons-page__toolbar">
      <u-input
        v-model="query"
        class="icons-page__search"
        placeholder="Search icons..."
        role="search"
        aria-label="搜索图标"
        clearable
      >
        <template #prefix>
          <u-icon><NormalIcons.Search /></u-icon>
        </template>
      </u-input>
      <p class="icons-page__count">{{ filtered.length }} icons</p>
      <u-segment v-model="activeSet" class="icons-demo__sets" :items="SET_OPTIONS" />
    </div>

    <main class="icons-page__main">
      <p v-if="filtered.length === 0" class="icons-page__empty">没有匹配的图标</p>

      <template v-else-if="activeSet === 'normal'">
        <section
          v-for="group in groupedNormalIcons"
          :key="group.name"
          class="icons-demo__group"
          :class="{ 'icons-demo__group--hot': group.isHot }"
        >
          <header class="icons-demo__group-header">
            <span v-if="group.isHot" class="icons-demo__group-badge">NEW</span>
            <h2 class="icons-demo__group-title">{{ group.name }}</h2>
            <p v-if="group.description" class="icons-demo__group-desc">{{ group.description }}</p>
          </header>

          <ul class="icons-demo__grid">
            <IconCell
              v-for="item in group.items"
              :key="item.kebab"
              :item="item"
              :active-set="activeSet"
              @toast="showToast"
            />
          </ul>
        </section>
      </template>

      <section v-else class="icons-demo__group">
        <ul class="icons-demo__grid">
          <IconCell
            v-for="item in filtered"
            :key="item.kebab"
            :item="item"
            :active-set="activeSet"
            @toast="showToast"
          />
        </ul>
      </section>
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
.icons-demo__sets {
  margin-left: auto;
}

.icons-demo__group {
  padding: 16px 20px 20px;
  border: 1px solid var(--u-border-color);
  border-radius: var(--u-radius-large);
  background-color: var(--u-bg-color-top);

  & + & {
    margin-top: 16px;
  }
}

// 热门分组：主题色描边 + 淡淡的主题色晕染
.icons-demo__group--hot {
  border-color: var(--u-color-primary-a-35);
  background-image: linear-gradient(var(--u-color-primary-a-4), var(--u-color-primary-a-4));
}

.icons-demo__group-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  margin-bottom: 12px;
}

.icons-demo__group-badge {
  align-self: center;
  padding: 1px 6px;
  border-radius: var(--u-radius-small);
  background: var(--u-color-primary);
  color: var(--u-text-color-white);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: 0.5px;
}

.icons-demo__group-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-title);
}

.icons-demo__group-desc {
  margin: 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.icons-demo__grid {
  display: grid;
  // 列宽下限给悬停操作按钮留出右上角，避免压到图标
  grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>

<style lang="scss" src="./demo-page.scss"></style>
