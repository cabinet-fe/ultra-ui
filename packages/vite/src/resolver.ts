import type { ComponentResolver } from 'unplugin-vue-components/types'

export interface VeltraDesktopUIResolverOptions {
  /**
   * Component style directories to exclude.
   * @example ['button', 'loading']
   */
  exclude?: string[]
  /**
   * Component style directories to include. Empty or omitted means all known
   * desktop components are eligible.
   * @example ['button', 'input', 'dialog']
   */
  include?: string[]
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
  'collapse-item': 'collapse',
  'action-group': 'action',
  'card-header': 'card',
  'card-cover': 'card',
  'card-content': 'card',
  'card-action': 'card',
  'checkbox-button': 'checkbox',
  'grid-item': 'grid',
  'list-item': 'list',
  'nav-sub': 'nav',
  'nav-item': 'nav',
  'dual-nav-app': 'dual-nav',
  'tabs-horizontal': 'tabs',
  'tabs-vertical': 'tabs'
}

const DESKTOP_COMPONENTS = new Set([
  'UAction',
  'UActionGroup',
  'UAutoComplete',
  'UBadge',
  'UBatchEdit',
  'UBreadcrumb',
  'UButton',
  'UButtonGroup',
  'UCalendar',
  'UCard',
  'UCardAction',
  'UCardContent',
  'UCardCover',
  'UCardHeader',
  'UCascade',
  'UCheckTag',
  'UCheckbox',
  'UCollapse',
  'UCollapseItem',
  'UCheckboxButton',
  'UCheckboxGroup',
  'UCodeEditor',
  'UConditionEditor',
  'UContextmenu',
  'UDatePanel',
  'UDatePicker',
  'UDateRangePicker',
  'UDialog',
  'UDrawer',
  'UDropdown',
  'UEmpty',
  'UExpressionEditor',
  'UFilePicker',
  'UFileViewer',
  'UFloatButton',
  'UForm',
  'UFormItem',
  'UGanttChart',
  'UGrid',
  'UGridInput',
  'UGridItem',
  'UGroupInput',
  'UIcon',
  'UKbd',
  'UInput',
  'ULayout',
  'UList',
  'UListItem',
  'ULoading',
  'UDualNav',
  'UNav',
  'UNavItem',
  'UNavSub',
  'UMessage',
  'UMessageConfirm',
  'UMultiSelect',
  'UMultiTreeSelect',
  'UNodeRender',
  'UNotification',
  'UNumber',
  'UNumberInput',
  'UNumberRangeInput',
  'UPaginator',
  'UPalette',
  'UPasswordInput',
  'UPopConfirm',
  'UProgress',
  'UProgressNodes',
  'URadio',
  'URadioGroup',
  'URichTextEditor',
  'UScroll',
  'USelect',
  'USlider',
  'USteps',
  'USwitch',
  'UTable',
  'UTableEditor',
  'UTabs',
  'UTabsHorizontal',
  'UTabsVertical',
  'UTag',
  'UText',
  'UTextarea',
  'UTheme',
  'UTip',
  'UTree',
  'UTreeSelect',
  'UWatermark'
])

function pascalToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (char, index) => (index > 0 ? '-' : '') + char.toLowerCase())
}

/**
 * Resolver for `unplugin-vue-components` that auto-imports `@veltra/desktop`
 * components and their style side effects.
 *
 * Style resolution relies on `@veltra/desktop` package exports conditions:
 * - **veltra-dev** (Vite dev): resolves to `src/components/<dir>/style.ts`
 *   (source SCSS pipeline, full HMR)
 * - **production** (Vite build): resolves to `dist/components/<dir>/style.js`
 *   (pre-compiled, CSS imported by the JS entry)
 */
export function VeltraDesktopUIResolver(
  options: VeltraDesktopUIResolverOptions = {}
): ComponentResolver {
  const { exclude = [], importStyle = true, include = [] } = options
  const excluded = new Set(exclude)
  const included = new Set(include)

  return {
    type: 'component',
    resolve(name: string) {
      if (!DESKTOP_COMPONENTS.has(name)) return

      const kebabName = pascalToKebab(name.slice(1))
      const styleDir = SHARED_STYLE_DIR[kebabName] ?? kebabName
      if (excluded.has(styleDir)) return
      if (included.size > 0 && !included.has(styleDir)) return

      return {
        name,
        from: '@veltra/desktop',
        sideEffects: importStyle ? `@veltra/desktop/components/${styleDir}/style` : undefined
      }
    }
  }
}
