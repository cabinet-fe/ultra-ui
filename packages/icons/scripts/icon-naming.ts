/**
 * SVG 图标文件命名规范（单一真源）
 *
 * - 仅使用 **kebab-case**、小写、ASCII；词段用 `-` 连接；禁止空格与中文文件名。
 * - 语义清晰：优先「对象-状态/变体」顺序（如 `circle-check`、`circle-check-filled`）；
 *   **分类由目录 `normal/`、`colorful/` 表达，文件名不重复 `normal-`/`colorful-` 前缀**。
 * - 与常见英文拼写一致；明显笔误在 `KNOWN_TYPOS` 中显式映射后纠正。
 */

/** 已知 basename（无扩展名）笔误 → 规范名 */
export const KNOWN_TYPOS: Readonly<Record<string, string>> = { 'sort-rigth': 'sort-right' }

/**
 * 表单控件图标：basename → `form-{basename}`（或语义特例）。
 * 与 playground「表单控件图标」分组一致；导出/组件名由 kebab 推导，如 `form-input` → `FormInput`。
 *
 * `form` / `form-form` → `form-container`（`FormContainer`）：根表单图标为容器布局语义，避免 `FormForm`。
 */
export const FORM_ICON_RENAMES: Readonly<Record<string, string>> = {
  // 根表单容器（曾用 form-form）
  form: 'form-container',
  'form-form': 'form-container',

  // HTML 保留标签名冲突
  input: 'form-input',
  select: 'form-select',
  textarea: 'form-textarea',
  table: 'form-table',

  // 其余表单控件
  'auto-complete': 'form-auto-complete',
  cascader: 'form-cascader',
  checkbox: 'form-checkbox',
  'date-picker': 'form-date-picker',
  'date-range-picker': 'form-date-range-picker',
  'file-picker': 'form-file-picker',
  'multi-select': 'form-multi-select',
  'multi-tree-select': 'form-multi-tree-select',
  'number-input': 'form-number-input',
  'number-range-input': 'form-number-range-input',
  'password-input': 'form-password-input',
  radio: 'form-radio',
  slider: 'form-slider',
  switch: 'form-switch',
  'tree-select': 'form-tree-select'
}

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isKebabCaseAscii(name: string): boolean {
  return KEBAB_RE.test(name)
}

/** 返回「无扩展名」的建议 basename（已应用笔误修正与表单重命名） */
export function suggestBasename(basenameWithoutExt: string): string {
  const typo = KNOWN_TYPOS[basenameWithoutExt]
  if (typo) return typo
  const formRenamed = FORM_ICON_RENAMES[basenameWithoutExt]
  if (formRenamed) return formRenamed
  return basenameWithoutExt
}

/** `user-circle` → `UserCircle`（由 .vue / 已规范化的 kebab basename 推导，不再套用表单重命名） */
export function kebabBasenameToComponentName(kebabBase: string): string {
  const base = KNOWN_TYPOS[kebabBase] ?? kebabBase
  return base
    .split('-')
    .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))
    .join('')
}

/**
 * `defineOptions({ name })`：与 HTML / Vue 保留名冲突时加 `U` 前缀（仅内部组件名，导出名不变）。
 * 表单控件已重命名为 `Form*` 的不再加 `U`。
 */
const DEFINE_OPTIONS_U_PREFIX = new Set([
  'Filter',
  'Image',
  'Link',
  'Search',
  'Time',
  'Title',
  'Video',
  'View'
])

export function resolveDefineOptionsName(kebabBase: string): string {
  const exportName = kebabBasenameToComponentName(kebabBase)
  if (DEFINE_OPTIONS_U_PREFIX.has(exportName)) return `U${exportName}`
  return exportName
}
