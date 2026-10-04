<template>
  <div ref="panel" class="playground-nav-search-panel">
    <template v-if="indexedGroups.length">
      <div
        v-for="group in indexedGroups"
        :key="group.section"
        class="playground-nav-search-panel__group"
      >
        <div class="playground-nav-search-panel__group-header">{{ group.section }}</div>
        <div
          v-for="option in group.options"
          :key="option.item.path"
          class="playground-nav-search-panel__option"
          :class="{ 'is-active': option.index === activeIndex }"
          :data-flat-index="option.index"
          @click="emit('select', option.item.path)"
        >
          <div class="playground-nav-search-panel__option-title">
            <template v-for="(segment, i) in option.segments" :key="i">
              <mark v-if="segment.hit" class="playground-nav-search-panel__option-hit">{{
                segment.text
              }}</mark>
              <template v-else>{{ segment.text }}</template>
            </template>
          </div>
          <div class="playground-nav-search-panel__option-meta">
            {{ formatMeta(option.item) }}
          </div>
        </div>
      </div>
    </template>
    <div v-else class="playground-nav-search-panel__empty">
      未找到相关结果<template v-if="query">：{{ query }}</template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef, watch } from 'vue'

import type { NavSearchGroup, NavSearchResultItem } from './nav-config'

defineOptions({ name: 'UNavSearchPanel' })

const {
  groups,
  query = '',
  activeIndex = -1
} = defineProps<{
  /** searchNavItems 产出的结果分组；空查询时为全量分组 */
  groups: NavSearchGroup[]
  /** 当前查询词，用于无结果占位文案 */
  query?: string
  /** 高亮项的扁平下标（跨组顺序，由键盘状态机驱动），-1 表示无高亮 */
  activeIndex?: number
}>()

const emit = defineEmits<{ select: [path: string] }>()

/** 标题片段：命中区间与普通区间交替 */
interface TitleSegment {
  text: string
  hit: boolean
}

/** 按 titleRanges 把标题切成命中/普通片段序列 */
function titleSegments(item: NavSearchResultItem): TitleSegment[] {
  const { title, titleRanges } = item
  if (!titleRanges.length) return [{ text: title, hit: false }]

  const segments: TitleSegment[] = []
  let cursor = 0
  for (const { start, end } of titleRanges) {
    if (start > cursor) segments.push({ text: title.slice(cursor, start), hit: false })
    segments.push({ text: title.slice(start, end), hit: true })
    cursor = end
  }
  if (cursor < title.length) segments.push({ text: title.slice(cursor), hit: false })
  return segments
}

/** 面板选项：结果项附带扁平下标与预切好的标题片段 */
interface PanelOption {
  item: NavSearchResultItem
  index: number
  segments: TitleSegment[]
}

/** 元信息行：分区 · 分类 */
function formatMeta(item: NavSearchResultItem): string {
  return [item.section, item.category].filter(Boolean).join(' · ')
}

/** 展开为带扁平下标的分组，只在 groups 变化时重算，键盘移动不重复切片 */
const indexedGroups = computed(() => {
  let index = 0
  return groups.map((group) => ({
    section: group.section,
    options: group.items.map((item) => ({ item, index: index++, segments: titleSegments(item) }))
  }))
})

const panelRef = useTemplateRef<HTMLElement>('panel')

/** active 变化时让对应项滚进面板可见区；post 等待 DOM 更新，覆盖查询变化与高亮重置同时发生的场景 */
watch(
  () => activeIndex,
  (index) => {
    if (index < 0) return
    panelRef.value
      ?.querySelector<HTMLElement>(`[data-flat-index="${index}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  },
  { flush: 'post' }
)
</script>

<style lang="scss" scoped>
@function use-var($basename, $nodes...) {
  $suffix: '';

  @each $node in $nodes {
    $suffix: $suffix + '-' + $node;
  }

  @return var(--u-#{$basename}#{$suffix});
}

// 面板被 Teleport 到共享弹层容器（usePop 的 #pop-container）。
// scoped 的 data-v 属性编译在本组件自身模板元素上，teleport 后仍生效，
// 不需要 nav-search.vue 旧方案那种 :has() 全局样式。
.playground-nav-search-panel {
  max-height: 320px;
  padding: calc(use-var(gap, small) / 2);
  overflow-y: auto;
  overflow-x: hidden;
  background-color: use-var(bg-color, top);
  border: use-var(border);
  border-radius: use-var(radius, default);
  box-shadow: use-var(shadow, lg);

  &__group-header {
    padding: calc(use-var(gap, small) / 2) use-var(gap, small);
    font-size: 11px;
    line-height: 1.4;
    color: use-var(text-color, second);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__option {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: calc(use-var(gap, small) / 2) use-var(gap, small);
    border-radius: use-var(radius, small);
    cursor: pointer;

    &:hover,
    &.is-active {
      background-color: use-var(bg-color, hover);
    }
  }

  &__option-title {
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    color: use-var(text-color, title);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__option-hit {
    color: use-var(color, primary);
    font-weight: 600;
    background: transparent;
  }

  &__option-meta {
    font-size: 11px;
    line-height: 1.4;
    color: use-var(text-color, second);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__empty {
    padding: use-var(gap, large) use-var(gap, default);
    font-size: 13px;
    color: use-var(text-color, second);
    text-align: center;
  }
}
</style>
