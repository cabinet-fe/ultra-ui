/**
 * 桌面组件级 `--u-*` token，与内置主题一起在 `UITheme.injectBuiltInThemes` 中注入 `html`。
 * 修改此处即可在 TS 侧统一调整组件外观，无需在各组件 `style.scss` 重复声明。
 */

/** 与 SCSS `fn.use-var($basename, $nodes...)` 输出一致 */
export function themeTokenVar(basename: string, ...nodes: Array<string | number>): string {
  const suffix = nodes.length ? `-${nodes.map(String).join('-')}` : ''
  return `var(--u-${basename}${suffix})`
}

const T = themeTokenVar

/** 亮色（及与暗色相同的尺寸类）下组件 token */
export const componentCssVarsLight: Record<string, string> = {
  '--u-table-border-color': '#e9e9e9',
  '--u-table-header-bg': '#f4f5f7',
  '--u-table-header-color': T('text-color', 'title'),
  '--u-table-stripe-bg': '#f8fafc',
  '--u-table-stripe-color': 'inherit',
  '--u-table-hover-bg': T('bg-color', 'hover'),
  '--u-table-hover-color': 'inherit',
  '--u-table-current-bg': T('bg-color', 'hover'),
  '--u-table-current-color': 'inherit',
  '--u-table-checked-bg': T('color', 'primary', 'light-9'),
  '--u-table-checked-color': 'inherit',
  '--u-menu-color': '#0f172a',
  '--u-menu-hover-bg': 'rgba(148, 163, 184, 0.12)',
  '--u-menu-hover-color': T('text-color', 'title'),
  '--u-menu-active-bg': 'rgba(59, 130, 246, 0.12)',
  '--u-menu-active-color': T('color', 'primary', 'dark', '1'),
  '--u-menu-height-small': '32px',
  '--u-menu-height-default': '36px',
  '--u-menu-height-large': '40px',
  '--u-menu-bg-color': T('bg-color', 'top'),
  '--u-menu-bg-blur': 'none',
  '--u-menu-bg-saturate': 'none',
  '--u-menu-bg-image': 'none',
  '--u-tag-small': '20px',
  '--u-tag-default': '24px',
  '--u-tag-large': '28px',
  '--u-switch-height-small': '18px',
  '--u-switch-height-default': '20px',
  '--u-switch-height-large': '24px',
  '--u-breadcrumb-small': '20px',
  '--u-breadcrumb-default': '22px',
  '--u-breadcrumb-large': '24px'
}

/** 暗色下组件 token（含与亮色相同的尺寸项，保证暗色 html 块自洽） */
export const componentCssVarsDark: Record<string, string> = {
  ...componentCssVarsLight,
  '--u-table-border-color': '#404040',
  '--u-table-header-bg': '#2a2a2a',
  '--u-table-header-color': T('text-color', 'main'),
  '--u-table-stripe-bg': '#2a2a2a',
  '--u-table-stripe-color': T('text-color', 'main'),
  '--u-table-hover-bg': '#333333',
  '--u-table-hover-color': T('text-color', 'title'),
  '--u-table-current-bg': T('bg-color', 'hover'),
  '--u-table-current-color': 'inherit',
  '--u-table-checked-bg': T('color', 'primary', 'dark', '1'),
  '--u-table-checked-color': 'inherit',
  '--u-menu-color': T('text-color', 'main'),
  '--u-menu-hover-bg': 'rgba(148, 163, 184, 0.14)',
  '--u-menu-hover-color': T('text-color', 'title'),
  '--u-menu-active-bg': 'rgba(96, 165, 250, 0.2)',
  '--u-menu-active-color': T('text-color', 'white'),
  '--u-menu-bg-color': T('bg-color', 'middle'),
  '--u-radio-border': '#595959',
  '--u-checkbox-border': '#595959'
}

function recordToDeclList(record: Record<string, string>): string[] {
  return Object.entries(record).map(([k, v]) => `${k}: ${v}`)
}

export const componentCssVarsLightDecls: string[] = recordToDeclList(componentCssVarsLight)

export const componentCssVarsDarkDecls: string[] = recordToDeclList(componentCssVarsDark)
