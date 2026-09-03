/**
 * 桌面组件级 `--u-*` token，随 `UITheme.render()` 按主题系列（light/dark）注入 `html`。
 * 修改此处即可在 TS 侧统一调整组件外观，无需在各组件 `style.scss` 重复声明。
 * nav 系列：外观（底色/前景）不在此列表，由 `navSidebarCssVars` 按主题 `nav.variant`
 * （dark 深底浅字 / light 浅底深字，默认 dark）与 `nav` 覆盖项注入，见 `ui-theme.ts`。
 */

/** 与 SCSS `fn.use-var($basename, $nodes...)` 输出一致 */
export function themeTokenVar(basename: string, ...nodes: Array<string | number>): string {
  const suffix = nodes.length ? `-${nodes.map(String).join('-')}` : ''
  return `var(--u-${basename}${suffix})`
}

const T = themeTokenVar

/** 亮色（及与暗色相同的尺寸类）下组件 token */
export const componentCssVarsLight: Record<string, string> = {
  '--u-focus-ring': `0 0 0 3px ${T('color', 'primary', 'a', '28')}`,
  '--u-table-border-color': T('border', 'color'),
  '--u-table-header-bg': T('bg-color', 'hover'),
  '--u-table-header-color': T('text-color', 'title'),
  '--u-table-stripe-bg': T('bg-color', 'middle'),
  '--u-table-stripe-color': 'inherit',
  '--u-table-hover-bg': T('bg-color', 'hover'),
  '--u-table-hover-color': 'inherit',
  '--u-table-current-bg': T('bg-color', 'hover'),
  '--u-table-current-color': 'inherit',
  '--u-table-checked-bg': T('color', 'primary', 'light-9'),
  '--u-table-checked-color': 'inherit',
  // ─── Nav 系列（nav / dual-nav / group-nav）尺寸与资源类；外观见文件底部 navSidebarCssVars ───
  '--u-nav-height-small': '32px',
  '--u-nav-height-default': '36px',
  '--u-nav-height-large': '40px',
  '--u-nav-bg-image': 'none',
  '--u-nav-rail-width': '56px',
  '--u-nav-rail-labeled-width': '72px',
  '--u-tag-small': '20px',
  '--u-tag-default': '24px',
  '--u-tag-large': '28px',
  '--u-switch-height-small': '18px',
  '--u-switch-height-default': '20px',
  '--u-switch-height-large': '24px',
  '--u-breadcrumb-small': '20px',
  '--u-breadcrumb-default': '22px',
  '--u-breadcrumb-large': '24px',

  // ─── Button (default & plain states) ───
  '--u-button-default-bg': T('bg-color', 'top'),
  '--u-button-default-border': T('border', 'color'),
  '--u-button-default-color': T('text-color', 'main'),
  '--u-button-default-hover-bg': T('bg-color', 'hover'),
  '--u-button-default-hover-border': T('border', 'color'),
  '--u-button-primary-plain-bg': T('color', 'primary', 'light', '9'),
  '--u-button-primary-plain-shadow': T('color', 'primary', 'light', '5'),
  '--u-button-success-plain-bg': T('color', 'success', 'light', '9'),
  '--u-button-success-plain-shadow': T('color', 'success', 'light', '5'),
  '--u-button-warning-plain-bg': T('color', 'warning', 'light', '9'),
  '--u-button-warning-plain-shadow': T('color', 'warning', 'light', '5'),
  '--u-button-danger-plain-bg': T('color', 'danger', 'light', '9'),
  '--u-button-danger-plain-shadow': T('color', 'danger', 'light', '5'),
  '--u-button-info-plain-bg': T('color', 'info', 'light', '9'),
  '--u-button-info-plain-shadow': T('color', 'info', 'light', '5'),

  // ─── Tree selection ───
  '--u-tree-node-selected-bg': T('color', 'primary', 'light', '9'),
  '--u-tree-node-selected-color': T('color', 'primary'),

  // ─── Cascade option active ───
  '--u-cascade-node-active-bg': T('color', 'primary', 'light', '9'),
  '--u-cascade-node-active-color': T('color', 'primary'),

  // ─── Select option ───
  '--u-select-option-hover-bg': T('bg-color', 'hover'),
  '--u-select-option-hover-color': T('text-color', 'title'),
  '--u-select-option-selected-bg': T('color', 'primary', 'light', '9'),
  '--u-select-option-selected-color': T('color', 'primary'),

  // ─── Auto Complete option ───
  '--u-auto-complete-option-hover-bg': T('bg-color', 'hover'),
  '--u-auto-complete-option-hover-color': T('text-color', 'title'),
  '--u-auto-complete-option-selected-bg': T('color', 'primary', 'light', '9'),
  '--u-auto-complete-option-selected-color': T('color', 'primary'),

  // ─── Contextmenu item ───
  '--u-contextmenu-item-hover-bg': T('bg-color', 'hover'),
  '--u-contextmenu-item-hover-color': T('text-color', 'title'),
  '--u-contextmenu-item-height-small': '24px',
  '--u-contextmenu-item-height-default': '28px',
  '--u-contextmenu-item-height-large': '32px',

  // ─── Expression Editor Chip ───
  '--u-expression-editor-chip-bg': T('color', 'primary', 'light', '9'),
  '--u-expression-editor-chip-color': T('color', 'primary'),

  // ─── Paginator active buttons ───
  '--u-paginator-btn-hover-bg': T('color', 'primary', 'light', '9'),
  '--u-paginator-btn-hover-color': T('text-color', 'title'),
  '--u-paginator-btn-active-bg': T('color', 'primary', 'light', '9'),
  '--u-paginator-btn-active-color': T('color', 'primary'),

  // ─── Tabs List background ───
  '--u-tabs-bar-bg': T('bg-color', 'hover'),
  '--u-tabs-active-bg': T('bg-color', 'top'),

  // ─── Tag Component Colors ───
  '--u-tag-primary-bg': T('color', 'primary', 'light', '9'),
  '--u-tag-primary-color': T('color', 'primary'),
  '--u-tag-primary-border': T('color', 'primary'),
  '--u-tag-success-bg': T('color', 'success', 'light', '9'),
  '--u-tag-success-color': T('color', 'success'),
  '--u-tag-success-border': T('color', 'success'),
  '--u-tag-warning-bg': T('color', 'warning', 'light', '9'),
  '--u-tag-warning-color': T('color', 'warning'),
  '--u-tag-warning-border': T('color', 'warning'),
  '--u-tag-danger-bg': T('color', 'danger', 'light', '9'),
  '--u-tag-danger-color': T('color', 'danger'),
  '--u-tag-danger-border': T('color', 'danger'),
  '--u-tag-info-bg': T('color', 'info', 'light', '9'),
  '--u-tag-info-color': T('color', 'info'),
  '--u-tag-info-border': T('color', 'info'),

  // ─── File Picker Colors ───
  '--u-file-picker-hover-bg': T('color', 'primary', 'light', '9'),
  '--u-card-header-bg': 'rgba(0, 0, 0, 0.015)',
  '--u-card-action-bg': 'rgba(0, 0, 0, 0.015)',
  '--u-card-padding-small': '8px',
  '--u-card-padding-default': '12px',
  '--u-card-padding-large': '16px',
  '--u-card-radius': T('radius', 'large')
}

/** 暗色下组件 token（含与亮色相同的尺寸项，保证暗色 html 块自洽） */
export const componentCssVarsDark: Record<string, string> = {
  ...componentCssVarsLight,
  '--u-focus-ring': `0 0 0 3px ${T('color', 'primary', 'a', '35')}`,
  '--u-table-border-color': T('border', 'color'),
  '--u-table-header-bg': T('bg-color', 'hover'),
  '--u-table-header-color': T('text-color', 'main'),
  '--u-table-stripe-bg': T('bg-color', 'middle'),
  '--u-table-stripe-color': T('text-color', 'main'),
  '--u-table-hover-bg': T('text-color', 'title', 'a', '5'),
  '--u-table-hover-color': T('text-color', 'title'),
  '--u-table-current-bg': T('bg-color', 'hover'),
  '--u-table-current-color': 'inherit',
  '--u-table-checked-bg': T('color', 'primary', 'dark', '1'),
  '--u-table-checked-color': 'inherit',
  '--u-radio-border': '#595959',
  '--u-checkbox-border': '#595959',

  // ─── Button (plain & text colors in dark mode) ───
  '--u-button-primary-plain-bg': T('color', 'primary', 'dark', '9'),
  '--u-button-primary-plain-shadow': T('color', 'primary', 'dark', '7'),
  '--u-button-success-plain-bg': T('color', 'success', 'dark', '9'),
  '--u-button-success-plain-shadow': T('color', 'success', 'dark', '7'),
  '--u-button-warning-plain-bg': T('color', 'warning', 'dark', '9'),
  '--u-button-warning-plain-shadow': T('color', 'warning', 'dark', '7'),
  '--u-button-danger-plain-bg': T('color', 'danger', 'dark', '9'),
  '--u-button-danger-plain-shadow': T('color', 'danger', 'dark', '7'),
  '--u-button-info-plain-bg': T('color', 'info', 'dark', '9'),
  '--u-button-info-plain-shadow': T('color', 'info', 'dark', '7'),

  // ─── Tree selection ───
  '--u-tree-node-selected-bg': T('color', 'primary', 'dark', '9'),
  '--u-tree-node-selected-color': T('color', 'primary'),

  // ─── Cascade option active ───
  '--u-cascade-node-active-bg': T('color', 'primary', 'dark', '9'),
  '--u-cascade-node-active-color': T('color', 'primary'),

  // ─── Select option ───
  '--u-select-option-hover-bg': T('bg-color', 'hover'),
  '--u-select-option-hover-color': T('text-color', 'title'),
  '--u-select-option-selected-bg': T('color', 'primary', 'dark', '9'),
  '--u-select-option-selected-color': T('color', 'primary'),

  // ─── Auto Complete option ───
  '--u-auto-complete-option-hover-bg': T('bg-color', 'hover'),
  '--u-auto-complete-option-hover-color': T('text-color', 'title'),
  '--u-auto-complete-option-selected-bg': T('color', 'primary', 'dark', '9'),
  '--u-auto-complete-option-selected-color': T('color', 'primary'),

  // ─── Contextmenu item ───
  '--u-contextmenu-item-hover-bg': T('bg-color', 'hover'),
  '--u-contextmenu-item-hover-color': T('text-color', 'title'),
  '--u-contextmenu-item-height-small': '24px',
  '--u-contextmenu-item-height-default': '28px',
  '--u-contextmenu-item-height-large': '32px',

  // ─── Expression Editor Chip ───
  '--u-expression-editor-chip-bg': T('color', 'primary', 'dark', '9'),
  '--u-expression-editor-chip-color': T('color', 'primary'),

  // ─── Paginator active buttons ───
  '--u-paginator-btn-hover-bg': T('color', 'primary', 'dark', '9'),
  '--u-paginator-btn-hover-color': T('color', 'primary'),
  '--u-paginator-btn-active-bg': T('color', 'primary', 'dark', '9'),
  '--u-paginator-btn-active-color': T('color', 'primary'),

  // ─── Tabs List background (improved dark contrast) ───
  '--u-tabs-bar-bg': T('bg-color', 'bottom'),
  '--u-tabs-active-bg': T('bg-color', 'top'),

  // ─── Tag Component Colors ───
  '--u-tag-primary-bg': T('color', 'primary', 'dark', '9'),
  '--u-tag-primary-color': T('color', 'primary'),
  '--u-tag-primary-border': T('color', 'primary'),
  '--u-tag-success-bg': T('color', 'success', 'dark', '9'),
  '--u-tag-success-color': T('color', 'success'),
  '--u-tag-success-border': T('color', 'success'),
  '--u-tag-warning-bg': T('color', 'warning', 'dark', '9'),
  '--u-tag-warning-color': T('color', 'warning'),
  '--u-tag-warning-border': T('color', 'warning'),
  '--u-tag-danger-bg': T('color', 'danger', 'dark', '9'),
  '--u-tag-danger-color': T('color', 'danger'),
  '--u-tag-danger-border': T('color', 'danger'),
  '--u-tag-info-bg': T('color', 'info', 'dark', '9'),
  '--u-tag-info-color': T('color', 'info'),
  '--u-tag-info-border': T('color', 'info'),

  // ─── File Picker Colors ───
  '--u-file-picker-hover-bg': T('color', 'primary', 'dark', '9'),
  '--u-card-header-bg': 'rgba(255, 255, 255, 0.015)',
  '--u-card-action-bg': 'rgba(255, 255, 255, 0.015)'
}

function recordToDeclList(record: Record<string, string>): string[] {
  return Object.entries(record).map(([k, v]) => `${k}: ${v}`)
}

export const componentCssVarsLightDecls: string[] = recordToDeclList(componentCssVarsLight)

export const componentCssVarsDarkDecls: string[] = recordToDeclList(componentCssVarsDark)

// ─── Nav 侧栏外观：深/浅变体 × 明/暗主题系列 ───
// 由 UITheme 按主题 `nav.variant`（默认 dark）选择注入，主题 `nav` 的其余键可逐项覆盖。

/** 侧栏外观变体：dark 深底浅字 / light 浅底深字 */
export type NavSidebarVariant = 'dark' | 'light'

/** 深侧栏 · 浅色主题下：深底（text-color.title）+ 浅前景，与浅色内容区拉开区分度 */
const navSidebarDarkInLight: Record<string, string> = {
  '--u-nav-bg-color': T('text-color', 'title'),
  '--u-nav-color': 'rgba(255, 255, 255, 0.72)',
  '--u-nav-hover-bg': 'rgba(255, 255, 255, 0.08)',
  '--u-nav-hover-color': T('text-color', 'white'),
  '--u-nav-active-bg': T('color', 'primary', 'a', '22'),
  '--u-nav-active-color': T('text-color', 'white'),
  '--u-nav-strong-color': T('text-color', 'white'),
  '--u-nav-second-color': 'rgba(255, 255, 255, 0.45)',
  '--u-nav-sub-border-color': 'rgba(255, 255, 255, 0.15)',
  '--u-nav-rail-bg': 'rgba(0, 0, 0, 0.2)'
}

/** 浅侧栏 · 浅色主题下：比内容区 top 低一档的浅底 + 深前景 */
const navSidebarLightInLight: Record<string, string> = {
  '--u-nav-bg-color': T('bg-color', 'middle'),
  '--u-nav-color': T('text-color', 'title'),
  '--u-nav-hover-bg': T('text-color', 'title', 'a', '8'),
  '--u-nav-hover-color': T('text-color', 'title'),
  '--u-nav-active-bg': T('color', 'primary', 'a', '10'),
  '--u-nav-active-color': T('color', 'primary', 'dark', '1'),
  '--u-nav-strong-color': T('text-color', 'title'),
  '--u-nav-second-color': T('text-color', 'second'),
  '--u-nav-sub-border-color': T('border', 'color', 'a', '52'),
  '--u-nav-rail-bg': T('bg-color', 'bottom')
}

/** 深侧栏 · 深色主题下：比内容区 top 深一档 */
const navSidebarDarkInDark: Record<string, string> = {
  '--u-nav-bg-color': T('bg-color', 'middle'),
  '--u-nav-color': T('text-color', 'main'),
  '--u-nav-hover-bg': T('text-color', 'title', 'a', '8'),
  '--u-nav-hover-color': T('text-color', 'title'),
  '--u-nav-active-bg': T('color', 'primary', 'a', '16'),
  '--u-nav-active-color': T('text-color', 'white'),
  '--u-nav-strong-color': T('text-color', 'title'),
  '--u-nav-second-color': T('text-color', 'second'),
  '--u-nav-sub-border-color': T('border', 'color', 'a', '52'),
  '--u-nav-rail-bg': T('bg-color', 'bottom')
}

/** 浅侧栏 · 深色主题下：提亮侧栏（与深色内容区反向对比） */
const navSidebarLightInDark: Record<string, string> = {
  '--u-nav-bg-color': T('bg-color', 'top'),
  '--u-nav-color': T('text-color', 'title'),
  '--u-nav-hover-bg': T('text-color', 'title', 'a', '8'),
  '--u-nav-hover-color': T('text-color', 'title'),
  '--u-nav-active-bg': T('color', 'primary', 'a', '22'),
  '--u-nav-active-color': T('color', 'primary'),
  '--u-nav-strong-color': T('text-color', 'title'),
  '--u-nav-second-color': T('text-color', 'second'),
  '--u-nav-sub-border-color': T('border', 'color', 'a', '52'),
  '--u-nav-rail-bg': T('bg-color', 'middle')
}

const navSidebarCssVars: Record<
  'light' | 'dark',
  Record<NavSidebarVariant, Record<string, string>>
> = {
  light: { dark: navSidebarDarkInLight, light: navSidebarLightInLight },
  dark: { dark: navSidebarDarkInDark, light: navSidebarLightInDark }
}

/** 某主题系列 + 侧栏变体下的 nav 外观 token（键为 `--u-nav-*`） */
export function navSidebarTokens(
  series: 'light' | 'dark',
  variant: NavSidebarVariant
): Record<string, string> {
  return { ...navSidebarCssVars[series][variant] }
}

/** 解析某主题系列 + 侧栏变体下的 nav 外观 token 声明列表 */
export function resolveNavSidebarDecls(
  series: 'light' | 'dark',
  variant: NavSidebarVariant
): string[] {
  return recordToDeclList(navSidebarCssVars[series][variant])
}
