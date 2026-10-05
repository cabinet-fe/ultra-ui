<template>
  <div class="device-stage">
    <div class="device-toolbar">
      <u-select
        v-model="deviceId"
        :options="deviceOptions"
        size="small"
        class="device-toolbar__select"
      />
      <u-button
        size="small"
        plain
        circle
        :icon="RotateRight"
        aria-label="切换横竖屏"
        @click="rotated = !rotated"
      />
      <label class="device-toolbar__fit">
        <u-switch v-model="fit" size="small" />
        适配
      </label>
      <span class="device-toolbar__caption">
        {{ view.width }} × {{ view.height }}<template v-if="fit"> · {{ percent }}%</template>
      </span>
    </div>

    <div ref="areaRef" class="device-area">
      <div class="device-holder" :style="holderStyle">
        <div class="device" :style="deviceStyle">
          <div class="device__screen">
            <!-- 状态栏占位安全区：内容从灵动岛下方开始，不与其重叠 -->
            <div class="device__status" aria-hidden="true">
              <span class="device__status-time">9:41</span>
              <span class="device__status-icons">
                <svg viewBox="0 0 17 11" width="17" height="11" fill="currentColor">
                  <rect x="0" y="7" width="3" height="4" rx="1" />
                  <rect x="4.7" y="5" width="3" height="6" rx="1" />
                  <rect x="9.4" y="2.5" width="3" height="8.5" rx="1" />
                  <rect x="14" y="0" width="3" height="11" rx="1" />
                </svg>
                <svg
                  viewBox="0 0 16 11"
                  width="16"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                >
                  <path d="M1.5 3.7a9.5 9.5 0 0 1 13 0" />
                  <path d="M4 6.3a6 6 0 0 1 8 0" />
                  <circle cx="8" cy="9.2" r="1.4" fill="currentColor" stroke="none" />
                </svg>
                <svg viewBox="0 0 25 12" width="25" height="12" fill="none">
                  <rect
                    x="0.6"
                    y="0.6"
                    width="20"
                    height="10.8"
                    rx="3.2"
                    stroke="currentColor"
                    opacity="0.4"
                  />
                  <rect x="2" y="2" width="14" height="8" rx="1.8" fill="currentColor" />
                  <path
                    d="M22.5 4v4c1.1-.3 1.8-1.1 1.8-2s-.7-1.7-1.8-2z"
                    fill="currentColor"
                    opacity="0.4"
                  />
                </svg>
              </span>
            </div>
            <div ref="viewportRef" class="device__viewport">
              <slot />
            </div>
          </div>
          <!-- 弹层挂载层：镜像屏幕内边距的兄弟节点，弹层 fixed 以它为包含块，不随内容滚动 -->
          <div ref="overlayRootRef" class="device__overlay-root"></div>
          <span class="device__island" aria-hidden="true"></span>
          <span class="device__home" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { RotateRight } from '@veltra/icons/normal'
import { setOverlayContainer } from '@veltra/mobile/components/_internal/overlay-container'
import { computed, onScopeDispose, ref, shallowRef, watchEffect } from 'vue'

interface DevicePreset {
  value: string
  label: string
  width: number
  height: number
}

// CSS px 视口尺寸，与 Chrome DevTools 设备工具栏同源
const DEVICES: DevicePreset[] = [
  { value: 'se', label: 'iPhone SE · 375×667', width: 375, height: 667 },
  { value: 'mini', label: 'iPhone 13 mini · 375×812', width: 375, height: 812 },
  { value: 'iphone-14', label: 'iPhone 14 · 390×844', width: 390, height: 844 },
  { value: 'pro-max', label: 'iPhone 14 Pro Max · 430×932', width: 430, height: 932 },
  { value: 'pixel-7', label: 'Pixel 7 · 412×915', width: 412, height: 915 },
  { value: 'galaxy-s8', label: 'Galaxy S8+ · 360×740', width: 360, height: 740 }
]

const deviceOptions = DEVICES.map(({ value, label }) => ({ value, label }))

function readStored<T extends string | boolean>(key: string, fallback: T): T {
  const stored = localStorage.getItem(key)
  return stored !== null && (typeof fallback === 'boolean' ? stored === 'true' : true)
    ? (stored as T)
    : fallback
}

const deviceId = ref(readStored('mobileDevice', 'iphone-14'))
const rotated = ref(readStored('mobileDeviceRotated', false))
const fit = ref(readStored('mobileDeviceFit', true))

watchEffect(() => {
  localStorage.setItem('mobileDevice', deviceId.value)
  localStorage.setItem('mobileDeviceRotated', String(rotated.value))
  localStorage.setItem('mobileDeviceFit', String(fit.value))
})

const preset = computed(() => DEVICES.find((d) => d.value === deviceId.value) ?? DEVICES[2]!)

const view = computed(() => ({
  width: rotated.value ? preset.value.height : preset.value.width,
  height: rotated.value ? preset.value.width : preset.value.height
}))

// 适配缩放：按可用区域与设备视口的比例整体缩放，避免高设备溢出滚动区
const areaRef = ref<HTMLElement>()
const overlayRootRef = shallowRef<HTMLElement>()
const viewportRef = shallowRef<HTMLElement>()

// 把弹层挂载层注册为 mobile 弹层宿主：底部弹层 / 对话框 / 消息挂进屏幕内，随设备缩放；
// 内容视口一并注册为背景滚动锁定目标（Dialog / Drawer / BottomSheet 打开期间锁定它）
watchEffect(() => {
  setOverlayContainer(overlayRootRef.value, viewportRef.value)
})
onScopeDispose(() => setOverlayContainer(undefined))

const areaSize = shallowRef({ width: 0, height: 0 })
const scale = ref(1)

const observer = new ResizeObserver(([entry]) => {
  areaSize.value = { width: entry.contentRect.width, height: entry.contentRect.height }
})
watchEffect(() => {
  if (areaRef.value) observer.observe(areaRef.value)
})
onScopeDispose(() => observer.disconnect())

watchEffect(() => {
  if (!fit.value) {
    scale.value = 1
    return
  }
  const { width, height } = areaSize.value
  if (!width || !height) return
  scale.value = Math.min(width / view.value.width, height / view.value.height, 1)
})

const percent = computed(() => Math.round(scale.value * 100))

const holderStyle = computed(() => ({
  width: `${Math.round(view.value.width * scale.value)}px`,
  height: `${Math.round(view.value.height * scale.value)}px`
}))

const deviceStyle = computed(() => ({
  width: `${view.value.width}px`,
  height: `${view.value.height}px`,
  transform: `scale(${scale.value})`
}))
</script>

<style lang="scss" scoped>
.device-stage {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.device-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.device-toolbar__select {
  width: 230px;
}

.device-toolbar__fit {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--u-text-color-second);
  cursor: pointer;
}

.device-toolbar__caption {
  margin-left: auto;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--u-text-color-second);
}

.device-area {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.device-holder {
  flex-shrink: 0;
}

// 机身边框（上/左右/下），弹层挂载层需镜像同值
$bezel-top: 26px;
$bezel-x: 12px;
$bezel-bottom: 20px;
// 状态栏安全区高度：内容从灵动岛下方开始
$status-height: 44px;

.device {
  position: relative;
  display: flex;
  flex-direction: column;
  // 硬件外壳：跨主题恒定的深色机身，不走主题 tokens
  padding: $bezel-top $bezel-x $bezel-bottom;
  border-radius: 44px;
  background: #16181d;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 24px 48px -16px rgba(0, 0, 0, 0.35),
    inset 0 0 0 2px rgba(255, 255, 255, 0.04);
  transform-origin: top left;
}

// 灵动岛落在屏幕状态栏带中央（bezel-top + 状态栏高度的一半再上移半个岛高）
.device__island {
  position: absolute;
  top: $bezel-top + ($status-height - 22px) / 2;
  left: 50%;
  width: 84px;
  height: 22px;
  border-radius: 999px;
  background: #05060a;
  transform: translateX(-50%);
  z-index: 1;
}

.device__screen {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 32px;
  background: var(--u-bg-color-bottom);
}

.device__status {
  flex-shrink: 0;
  height: $status-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 0 28px;
  font-size: 14px;
  font-weight: 600;
  color: var(--u-text-color-main);
  font-variant-numeric: tabular-nums;
}

.device__status-icons {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.9;
}

.device__viewport {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  // 手机屏幕不显示滚动条
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.device__overlay-root {
  position: absolute;
  inset: $bezel-top $bezel-x $bezel-bottom;
  border-radius: 32px;
  overflow: hidden;
  // 作为弹层 position: fixed 的包含块：铺满屏幕并跟随设备缩放
  transform: translateZ(0);
  pointer-events: none;

  > :deep(*) {
    pointer-events: auto;
  }
}

.device__home {
  position: absolute;
  bottom: 7px;
  left: 50%;
  width: 96px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
  transform: translateX(-50%);
}
</style>

<style lang="scss">
// 移动端 demo 页统一皮肤：全部 mobile 演示页共用 .demo / section / .tip 结构，
// 在设备壳层一处收口，替代逐页写排版。仅命中 .device__viewport 内部，不影响 desktop 演示页。
.device__viewport {
  .demo {
    padding: 12px 12px 28px;
  }

  .demo section {
    padding: 14px 14px 16px;
    background: var(--u-bg-color-top);
    border: 1px solid var(--u-border-mutedColor);
    border-radius: var(--u-radius-large);
    box-shadow: var(--u-shadow-sm);
  }

  // 选择器多一层 section，压过 demo 页 scoped 样式里 h3 的 margin
  .demo section > h3 {
    margin: 0 0 12px;
  }

  .demo :is(.tip, .note) {
    margin: 12px 0 0;
  }
}
</style>
