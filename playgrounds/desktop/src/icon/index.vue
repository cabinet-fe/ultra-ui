<template>
  <div class="u-icon-showcase">
    <!-- Header Section -->
    <header class="showcase-header">
      <h1 class="title">Icons 常用图标库</h1>
      <p class="subtitle">完全自主设计，基于 16x16 高精细整数网格像素对齐的 SVG 单色图标系统</p>

      <!-- Fuzzy Search Bar -->
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="在 170+ 图标中搜索... (例如: input, select)"
          class="search-input"
        />
        <span v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</span>
      </div>
    </header>

    <!-- Showcase Area -->
    <div class="showcase-body">
      <div
        v-for="group in filteredGroups"
        :key="group.name"
        class="icon-group"
        :class="{ 'is-hot': group.isHot }"
      >
        <!-- Group Title & Header -->
        <div class="group-header">
          <div class="group-title-line">
            <span class="group-badge" v-if="group.isHot">NEW</span>
            <h2 class="group-name">{{ group.name }}</h2>
          </div>
          <p v-if="group.description" class="group-desc">{{ group.description }}</p>
        </div>

        <!-- Icons Grid -->
        <div class="icons-grid">
          <div
            v-for="iconName in group.icons"
            :key="iconName"
            class="icon-card"
            @click="copyIconCode(iconName)"
            title="点击复制组件代码"
          >
            <div class="icon-box">
              <u-icon :size="24">
                <component :is="NormalIcons[iconName]" />
              </u-icon>
            </div>
            <span class="icon-label">{{ iconName }}</span>
          </div>
        </div>
      </div>

      <!-- No Results State -->
      <div v-if="filteredGroups.length === 0" class="no-results">
        <u-icon :size="48" class="no-results-icon"><component :is="NormalIcons.Search" /></u-icon>
        <p>未找到与 "{{ searchQuery }}" 相关的图标</p>
      </div>
    </div>

    <!-- Glassmorphism Copy Toast Notification -->
    <transition name="toast-slide">
      <div v-if="toast.visible" class="copy-toast">
        <span class="toast-check">✓</span>
        <span class="toast-msg"
          >已复制 <code>&lt;{{ toast.name }} /&gt;</code> 到剪贴板</span
        >
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import * as NormalIcons from '@veltra/icons/normal'
import { ref, computed } from 'vue'

// Fuzzy search state
const searchQuery = ref('')

// Toast state
const toast = ref({ visible: false, name: '' })

// Groups configurations
const groups = [
  {
    name: '表单控件图标',
    description: '用于表单设计器或低代码平台中，代表各个控件本身的图标',
    isHot: true,
    icons: [
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
    icons: [
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
    icons: [
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
    icons: [
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
    icons: [
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

// Computed fuzzy filter
const filteredGroups = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return groups

  return groups
    .map((group) => {
      const matchedIcons = group.icons.filter((icon) => icon.toLowerCase().includes(query))
      return Object.assign({}, group, { icons: matchedIcons })
    })
    .filter((group) => group.icons.length > 0)
})

// Copy clipboard feature
const copyIconCode = (name: string) => {
  const code = `<${name} />`
  navigator.clipboard.writeText(code).then(() => {
    toast.value.name = name
    toast.value.visible = true

    // Clear previous timeout if double click
    setTimeout(() => {
      if (toast.value.name === name) {
        toast.value.visible = false
      }
    }, 2000)
  })
}
</script>

<style scoped>
.u-icon-showcase {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #1e293b;
}

/* Header design */
.showcase-header {
  text-align: center;
  margin-bottom: 48px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 15px;
  color: #64748b;
  margin-bottom: 28px;
}

/* Search bar design */
.search-wrapper {
  position: relative;
  max-width: 480px;
  margin: 0 auto;
  box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.12);
  border-radius: 9999px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input {
  width: 100%;
  padding: 14px 24px 14px 50px;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  font-size: 14px;
  outline: none;
  background-color: #f8fafc;
  transition: all 0.3s;
}

.search-input:focus {
  border-color: #3b82f6;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 16px;
}

.search-clear {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
  padding: 4px;
}

.search-clear:hover {
  color: #64748b;
}

/* Group container styling */
.icon-group {
  margin-bottom: 40px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  transition: box-shadow 0.3s;
}

.icon-group:hover {
  box-shadow: 0 10px 25px -5px rgba(148, 163, 184, 0.15);
}

/* Hot / New group special border highlight */
.icon-group.is-hot {
  border: 1px solid rgba(59, 130, 246, 0.25);
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.4) 0%, #ffffff 100%);
}

.group-header {
  margin-bottom: 20px;
}

.group-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.group-name {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.group-desc {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

/* Grid layout for icon cards */
.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

/* Individual card styling */
.icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.icon-card:hover {
  transform: translateY(-3px);
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.icon-card:active {
  transform: scale(0.95);
}

.icon-card:hover .icon-box {
  color: #3b82f6;
}

.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  color: #475569;
  transition: color 0.2s;
}

.icon-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 10px;
  text-align: center;
  word-break: break-all;
  width: 100%;
}

.icon-card:hover .icon-label {
  color: #1e3a8a;
  font-weight: 500;
}

/* No results fallback style */
.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.no-results-icon {
  color: #cbd5e1;
}

/* Glassmorphism Copy Toast Notification styling */
.copy-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  font-size: 13px;
}

.toast-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 800;
}

.toast-msg code {
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #60a5fa;
}

/* Transition Animations for Toast */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}
</style>
