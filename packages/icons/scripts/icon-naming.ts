/**
 * SVG 图标文件命名规范（单一真源）
 *
 * - 仅使用 **kebab-case**、小写、ASCII；词段用 `-` 连接；禁止空格与中文文件名。
 * - 语义清晰：优先「对象-状态/变体」顺序（如 `circle-check`、`circle-check-filled`）；
 *   **分类由目录 `normal/`、`colorful/` 表达，文件名不重复 `normal-`/`colorful-` 前缀**。
 * - 与常见英文拼写一致；明显笔误在 `KNOWN_TYPOS` 中显式映射后纠正。
 */

/** 已知 basename（无扩展名）笔误 → 规范名 */
export const KNOWN_TYPOS: Readonly<Record<string, string>> = {
  'sort-rigth': 'sort-right'
}

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isKebabCaseAscii(name: string): boolean {
  return KEBAB_RE.test(name)
}

/** 返回「无扩展名」的建议 basename（已应用笔误修正；其余与原名相同则规范已满足） */
export function suggestBasename(basenameWithoutExt: string): string {
  const typo = KNOWN_TYPOS[basenameWithoutExt]
  if (typo) return typo
  return basenameWithoutExt
}

/** `user-circle` → `UserCircle`（与 gen-vue-icons 中组件名一致） */
export function kebabBasenameToComponentName(kebabBase: string): string {
  return suggestBasename(kebabBase)
    .split('-')
    .map(s => s.slice(0, 1).toUpperCase() + s.slice(1))
    .join('')
}
