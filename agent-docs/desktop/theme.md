---
title: UTheme 主题编辑器
description: '@veltra/desktop 内的可视化主题编辑面板 UTheme：分「基础样式」「组件样式」双维度，按子组呈现全局与各组件主题配置，支持实时预览、12 套内置预设切换、单项/本组/全局重置与导出 theme-config.json。'
aliases: [Theme, theme, 主题编辑器, 主题定制, 主题配置面板]
keywords:
  [
    UITheme,
    loadTheme,
    ThemeExposed,
    exportTheme,
    applyLightPreset,
    applyDarkPreset,
    reset,
    theme-config.json,
    --u-*,
    THEME_SECTIONS,
    THEME_PRESETS,
    主题编辑,
    主题定制,
    CSS 变量,
    深色预设,
    浅色预设,
    主题导出,
    变量搜索
  ]
---

# UTheme 主题编辑器

`@veltra/desktop` 导出的可视化主题编辑组件 `UTheme`：以「基础样式」（4 大类：颜色、字体排版、尺寸、其它）和「组件样式」（10 个分组：按钮、导航栏、表格、卡片、标签、警告提示、选择与菜单、表单控件、页签与导览、浮层与细节）双维度组织全部可定制项；交互以可视化控件为主（调色盘、开关 + 滑块、分段选择、预设下拉、紧凑数字步进器），只向用户展示中文标签，修改实时写入对应 `--u-*` CSS 变量并立即生效。

不带 `theme` 属性时克隆并热替换当前已加载主题；带 `theme` 属性时编辑指定的 `UITheme` 实例。主题的安装与程序化切换（`loadTheme` / `lightTheme` / `darkTheme`）属于 `@veltra/styles/theme`，本组件只负责可视化编辑。

## 快速上手

```vue
<script setup lang="ts">
import { UTheme } from '@veltra/desktop'
</script>

<template>
  <!-- 编辑当前已加载主题；应用入口必须已执行 loadTheme()，否则编辑的是临时副本 -->
  <UTheme style="height: 680px" />
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
  /** 恢复到当前基线主题（编辑开始时或最近一次切换预设时的状态） */
  reset: () => void
  /** 把当前主题导出为 theme-config.json 下载 */
  exportTheme: () => void
  /** 应用默认浅色预设，并把基线重置为该预设 */
  applyLightPreset: () => void
  /** 应用默认深色预设，并把基线重置为该预设 */
  applyDarkPreset: () => void
}
```

## 参数说明

| 参数    | 类型      | 默认 | 必填 | 约束                                                                                                                                                                |
| ------- | --------- | ---- | :--: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme` | `UITheme` | `—`  |  否  | 缺省时组件克隆当前主题为编辑副本并 `loadTheme` 热替换，改动全局实时生效；传入时改动写入该实例并调用其 `render()`，是否影响全局取决于该实例是否已被 `loadTheme` 加载 |

### 内置编辑分组

- **基础样式（4 大类）**：颜色（品牌状态色/中性色/背景色/文字色/边框阴影色）、字体排版（字体族预设预览 + 标题/正文/辅助字号）、尺寸（圆角/表单高度/间距/边框宽度/断点）、其它（开关 + 滑块控制毛玻璃滤镜、边框线型、阴影参数与层级阴影预设、毫秒动效与缓动曲线预设）。
- **组件样式（10 组）**：按钮、导航栏（支持 `nav.variant` 及对应变体色彩与高度/轨宽）、表格、卡片、标签、警告提示、选择与菜单（Select / AutoComplete / Cascade / Contextmenu）、表单控件（Switch / Radio / Checkbox / Rate / FilePicker / ExpressionEditor）、页签与导览（Tabs / Tree / Paginator / Breadcrumb / Steps）、浮层与细节（Drawer / FocusRing / BatchEdit / Kbd）。

面板能力：

- **双维度分段切换**：顶栏切换「基础样式」与「组件样式」，并展示各维度改动计数；
- **跨维度搜索与仅看改动**：按中文配置名称或分组名过滤（当前维度无命中时自动跳转至命中的另一维度）；「仅看改动」聚焦已偏离基线的配置项；
- **预设切换与分级重置**：顶栏下拉支持直接切换 12 套内置预设；支持单项恢复默认、重置本组与全局重置。

## 方法与事件

无事件。暴露 4 个同步方法（经 `ThemeExposed` 解构，模板 ref 直接调用）：

| 方法                 | 返回         | 行为                                                                        |
| -------------------- | ------------ | --------------------------------------------------------------------------- |
| `reset()`            | `void`，同步 | 把主题恢复为基线快照并 `render()`；基线是编辑开始时或最近一次应用预设时的值 |
| `exportTheme()`      | `void`，同步 | `JSON.stringify` 当前主题后生成 `theme-config.json` 触发浏览器下载          |
| `applyLightPreset()` | `void`，同步 | 应用浅色预设、`series` 置为 `'light'`，基线重置为浅色预设                   |
| `applyDarkPreset()`  | `void`，同步 | 应用深色预设、`series` 置为 `'dark'`，基线重置为深色预设                    |

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
  <UTheme ref="theme" style="height: 680px" />

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
  <UTheme :theme="draft" style="height: 680px" />
</template>
```

## 注意事项

> [!WARNING]
>
> - `UTheme` 是编辑器，不是主题容器/Provider：不需要也不能用包裹子组件的方式下发主题；应用主题仍由 `@veltra/styles/theme` 的 `loadTheme()` 完成。
> - 缺省使用（不传 `theme`）时，打开组件即会克隆当前主题并 `loadTheme` 热替换——改动立刻影响全站；只想试验请传独立的 `UITheme` 实例。
> - `reset()` 恢复的是「基线」（打开时或最近一次预设应用后的状态），不是出厂浅色值；要回出厂浅色用 `applyLightPreset()`。
> - 主题必须初始化：入口 `import '@veltra/styles/normalize'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。
