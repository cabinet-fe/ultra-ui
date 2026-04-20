import type { ComponentResolver } from 'unplugin-vue-components/types'

export interface VeltraDesktopUIResolverOptions {
  /**
   * Whether to import component styles as side effects.
   * @default true
   */
  importStyle?: boolean
}

/**
 * Components that reside in another component's directory and share its style entry.
 *
 * These components don't have their own `style.ts` — they live inside a parent
 * component directory and use the parent's style (e.g. `UButtonGroup` lives in
 * `button/` and uses `button/style.ts`).
 */
const SHARED_STYLE_DIR: Record<string, string> = {
  'button-group': 'button',
  'action-group': 'action',
  'card-header': 'card',
  'card-cover': 'card',
  'card-content': 'card',
  'card-action': 'card',
  'checkbox-button': 'checkbox',
  'grid-item': 'grid',
  'list-item': 'list',
  'menu-sub': 'menu',
  'menu-item': 'menu',
  'tabs-horizontal': 'tabs',
  'tabs-vertical': 'tabs'
}

function pascalToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (char, index) => (index > 0 ? '-' : '') + char.toLowerCase())
}

/**
 * Resolver for `unplugin-vue-components` that auto-imports `@veltra/desktop`
 * components and their style side effects.
 *
 * Style resolution relies on `@veltra/desktop` package exports conditions:
 * - **development** (Vite dev): resolves to `src/components/<dir>/style.ts`
 *   (source SCSS pipeline, full HMR)
 * - **production** (Vite build): resolves to `dist/components/<dir>/style.js`
 *   (pre-compiled, CSS already injected)
 */
export function VeltraDesktopUIResolver(
  options: VeltraDesktopUIResolverOptions = {}
): ComponentResolver {
  const { importStyle = true } = options

  return {
    type: 'component',
    resolve(name: string) {
      if (!/^U[A-Z]/.test(name)) return

      const kebabName = pascalToKebab(name.slice(1))
      const styleDir = SHARED_STYLE_DIR[kebabName] ?? kebabName

      return {
        name,
        from: '@veltra/desktop',
        sideEffects: importStyle ? `@veltra/desktop/components/${styleDir}/style` : undefined
      }
    }
  }
}
