<template>
  <aside :class="[cls.b, bem.is('fullscreen', fullscreenState)]">
    <div :class="cls.e('card')">
      <div :class="cls.e('header')">
        <UIcon v-if="headerIcon" :class="[cls.e('icon'), statusClass]">
          <component :is="headerIcon" />
        </UIcon>
        <span :class="cls.e('title')">{{ panelTitle }}</span>
        <slot name="header-actions" :fullscreen="fullscreenState" :refresh="refresh" />
        <UIcon v-if="refreshable" :class="cls.e('refresh')" title="刷新" @click="refresh">
          <Refresh />
        </UIcon>
        <UIcon
          v-if="fullscreenable"
          :class="cls.e('fullscreen')"
          :title="fullscreenState ? '还原' : '全屏'"
          @click="fullscreenState = !fullscreenState"
        >
          <Recover v-if="fullscreenState" />
          <Maximum v-else />
        </UIcon>
        <UIcon v-if="closable" :class="cls.e('close')" title="关闭面板" @click="emit('close')">
          <Close />
        </UIcon>
      </div>

      <UScroll :class="cls.e('body')">
        <!-- 以 keyed Fragment 触发内容刷新：无论默认插槽或工具 render 都会重建实例 -->
        <template v-for="k in [refreshKey]" :key="`refresh-${k}`">
          <slot :tool-call="toolCall" :refresh-key="refreshKey">
            <component
              :is="resolvedTool.render"
              v-if="resolvedTool?.render && toolCall"
              :tool-call="toolCall"
            />
            <div v-else-if="toolCall" :class="cls.e('fallback')">
              <pre
                v-if="fallbackRaw"
                :class="[cls.e('data'), bem.is('error', toolCall.status === 'error')]"
                >{{ fallbackRaw }}</pre>
            </div>
          </slot>
        </template>
      </UScroll>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import './style'
import { UIcon, UScroll } from '@veltra/desktop'
import { Close, Maximum, Recover, Refresh } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, ref, watch } from 'vue'

import type { ChatToolCall } from '../../chat/types'
import type { _AiSidePanelExposed, AiSidePanelEmits, AiSidePanelProps } from '../../types'
import { AiChatDIKey } from '../_shared/di'
import { resolveToolHeaderIcon, toolStatusClass } from '../_shared/tool-call-brief'

defineOptions({ name: 'UAiSidePanel' })

// fullscreen 显式保留 undefined 默认值以区分受控与非受控模式
const props = withDefaults(defineProps<AiSidePanelProps>(), {
  fullscreen: undefined,
  refreshable: true,
  fullscreenable: true,
  closable: true
})

const emit = defineEmits<AiSidePanelEmits>()

defineSlots<{
  /** 自定义面板主体内容 */
  default(scope: { toolCall?: ChatToolCall; refreshKey: number }): any
  /** 头部自定义操作区（位于刷新按钮之前） */
  'header-actions'(scope: { fullscreen: boolean; refresh: () => void }): any
}>()

const cls = bem('ai-side-panel')
const di = inject(AiChatDIKey, undefined)

const innerFullscreen = ref(false)

watch(
  () => props.fullscreen,
  (val) => {
    if (val !== undefined) innerFullscreen.value = val
  },
  { immediate: true }
)

const fullscreenState = computed({
  get: () => (props.fullscreen !== undefined ? props.fullscreen : innerFullscreen.value),
  set: (val: boolean) => {
    innerFullscreen.value = val
    emit('update:fullscreen', val)
  }
})

// 切换聚焦的工具调用时退出全屏：新内容从常规面板重新看起
watch(
  () => props.toolCall?.id,
  () => {
    fullscreenState.value = false
  }
)

/** 刷新计数：递增时强制重建面板内渲染实例 */
const refreshKey = ref(0)

const refresh = () => {
  refreshKey.value += 1
  emit('refresh')
}

/** 当前调用对应的工具定义或渲染元信息（显式 tool 优先于 DI 回落） */
const resolvedTool = computed(
  () => props.tool ?? (props.toolCall ? di?.tools?.value[props.toolCall.name] : undefined)
)

const statusClass = computed(() => (props.toolCall ? toolStatusClass(props.toolCall.status) : ''))

/** 头部图标：显式 icon > meta.icon > 工具图标映射 > 内置规则 > 兜底 */
const headerIcon = computed(
  () =>
    props.icon ??
    (props.toolCall
      ? resolveToolHeaderIcon(props.toolCall, resolvedTool.value, props.toolIcons, di)
      : undefined)
)

/** 面板标题：显式 title > panelTitle > label > name */
const panelTitle = computed(() => {
  if (props.title !== undefined) return props.title
  const t = resolvedTool.value
  const pt = t?.panelTitle
  if (typeof pt === 'function' && props.toolCall) return pt(props.toolCall)
  return (typeof pt === 'string' ? pt : undefined) ?? t?.label ?? props.toolCall?.name ?? ''
})

/** 未提供 render 时的兜底展示 */
const fallbackRaw = computed(() => props.toolCall?.error ?? props.toolCall?.result)

defineExpose<_AiSidePanelExposed>({ fullscreen: fullscreenState, refresh })
</script>
