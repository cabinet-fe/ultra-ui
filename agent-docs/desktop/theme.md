---
title: UTheme 主题编辑器
description: "@veltra/desktop 内的可视化主题编辑面板 UTheme：搜索并修改 52 个主题变量（色板、表面、控件尺度、字体、断点），改动实时写入 --u-* CSS 变量，支持浅色/深色预设、重置与导出 theme-config.json。"
aliases: [Theme, theme, 主题编辑器, 主题定制, 主题配置面板]
keywords: [UITheme, loadTheme, ThemeExposed, exportTheme, applyLightPreset, applyDarkPreset, reset, theme-config.json, --u-*, THEME_SECTIONS, 主题编辑, 主题定制, CSS 变量, 深色预设, 浅色预设, 主题导出, 变量搜索]
---

# UTheme 主题编辑器

`@veltra/desktop` 导出的可视化主题编辑组件 `UTheme`：内置 5 个分组共 52 个主题字段的编辑面板（调色板、数字、下拉、文本四类控件），修改实时写入对应 `--u-*` CSS 变量并立即生效；不带 `theme` 属性时直接编辑并热替换当前已加载主题，带 `theme` 属性时编辑指定的 `UITheme` 实例。主题的安装与程序化切换（`loadTheme` / `lightTheme` / `darkTheme`）属于 `@veltra/styles/theme`，本组件只负责可视化编辑。

## 快速上手

```vue
<script setup lang="ts">
import { UTheme } from '@veltra/desktop'
</script>

<template>
  <!-- 编辑当前已加载主题；应用入口必须已执行 loadTheme()，否则编辑的是临时副本 -->
  <UTheme style="height: 640px" />
</template>
```

主题初始化前提（入口执行一次）：

```ts
// src/main.ts
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme()
```

## API 签名

```ts
import type { UITheme } from '@veltra/styles/theme'

/** 主题组件属性 */
export interface ThemeProps {
  /** 指定要编辑的主题实例；缺省时跟随当前已加载主题（currentTheme），未加载任何主题时回退浅色预设 */
  theme?: UITheme
}

/** 暴露成员经自动解构后可直接从模板 ref 访问；四个方法全部同步、返回 void */
export interface ThemeExposed {
  /** 恢复到当前基线主题（编辑开始时或最近一次应用预设时的状态） */
  reset: () => void
  /** 把当前主题导出为 theme-config.json 下载 */
  exportTheme: () => void
  /** 应用浅色预设，并把基线重置为该预设 */
  applyLightPreset: () => void
  /** 应用深色预设，并把基线重置为该预设 */
  applyDarkPreset: () => void
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `theme` | `UITheme` | `—` | 否 | 缺省时组件克隆当前主题为编辑副本并 `loadTheme` 热替换，改动全局实时生效；传入时改动写入该实例并调用其 `render()`，是否影响全局取决于该实例是否已被 `loadTheme` 加载 |

### 内置编辑分组（共 52 个字段）

| 分组 key | 标题 | 字段数 | 字段构成 |
| --- | --- | :---: | --- |
| `color` | 综合色板 | 7 | `color.primary/success/warning/danger/info/disabled/default` |
| `surface` | 表面层次 | 22 | `bg.color.*`、`bg.filter.blur/saturate`、`text-color.*`、`border.color/width/style`、`shadow.*` |
| `control` | 表单尺度 | 9 | `radius.small/default/large`、`form-component-height.*`、`gap.*`（px，带 min/max） |
| `typography` | 字体系统 | 10 | `font-family`、`font-size-title.*`、`font-size-main.*`、`font-size-assist.*` |
| `responsive` | 响应断点 | 4 | `breakpoint.xs/sm/md/lg` |

面板能力：顶栏搜索按变量名、中文标签或分组过滤；「仅看改动」只显示与基线不同的字段；每个字段展示 Theme 路径（如 `theme.color.primary`）与 CSS 变量名（如 `--u-color-primary`）；头部标签显示基线来源与改动计数。

## 方法与事件

无事件。暴露 4 个同步方法（经 `ThemeExposed` 解构，模板 ref 直接调用）：

| 方法 | 返回 | 行为 |
| --- | --- | --- |
| `reset()` | `void`，同步 | 把主题恢复为基线快照并 `render()`；基线是编辑开始时或最近一次应用预设时的值 |
| `exportTheme()` | `void`，同步 | `JSON.stringify` 当前主题后生成 `theme-config.json` 触发浏览器下载 |
| `applyLightPreset()` | `void`，同步 | 应用浅色预设、`series` 置为 `'light'`，基线重置为浅色预设 |
| `applyDarkPreset()` | `void`，同步 | 应用深色预设、`series` 置为 `'dark'`，基线重置为深色预设 |

## 典型示例

### 用按钮驱动预设 / 重置 / 导出

```vue
<script setup lang="ts">
import { UButton, UTheme } from '@veltra/desktop'
import type { ThemeExposed } from '@veltra/desktop'
import { useTemplateRef } from 'vue'

const themeRef = useTemplateRef<ThemeExposed>('theme')
</script>

<template>
  <UTheme ref="theme" style="height: 640px" />

  <UButton @click="themeRef?.applyLightPreset()">浅色预设</UButton>
  <UButton @click="themeRef?.applyDarkPreset()">深色预设</UButton>
  <UButton @click="themeRef?.reset()">重置</UButton>
  <UButton type="primary" @click="themeRef?.exportTheme()">导出</UButton>
  <!-- 导出得到 theme-config.json -->
</template>
```

### 编辑独立的 UITheme 实例（不影响当前主题）

```vue
<script setup lang="ts">
import { UTheme } from '@veltra/desktop'
import { UITheme, lightTheme } from '@veltra/styles/theme'

// 深拷贝出独立数据再建实例：直接传 lightTheme.theme 会共享引用，编辑会污染预设
// 需自行 loadTheme(draft) 才会全局生效
const snapshot = JSON.parse(JSON.stringify(lightTheme.theme))
const draft = new UITheme(snapshot, { series: 'light' })
</script>

<template>
  <UTheme :theme="draft" style="height: 640px" />
</template>
```

## 注意事项

> [!WARNING]
> - `UTheme` 是编辑器，不是主题容器/Provider：不需要也不能用包裹子组件的方式下发主题；应用主题仍由 `@veltra/styles/theme` 的 `loadTheme()` 完成。
> - 缺省使用（不传 `theme`）时，打开组件即会克隆当前主题并 `loadTheme` 热替换——改动立刻影响全站；只想试验请传独立的 `UITheme` 实例。
> - `reset()` 恢复的是「基线」（打开时或最近一次预设应用后的状态），不是出厂浅色值；要回出厂浅色用 `applyLightPreset()`。
> - 编辑面板字段集固定（52 项），不接受自定义字段配置；`nav`（侧栏外观）等不在面板内。
> - 主题必须初始化：入口 `import '@veltra/styles/normalize'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。
