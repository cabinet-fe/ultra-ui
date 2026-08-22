import {
  createRouter,
  createWebHistory,
  type RouteComponent,
  type Router,
  type RouteRecordRaw
} from 'vue-router'

import { DEFAULT_ROUTE, demoMeta } from './nav-config'

const desktopModules = import.meta.glob<{ default: RouteComponent }>('./src/desktop/**/index.vue')
const iconsModules = import.meta.glob<{ default: RouteComponent }>('./src/icons/**/index.vue')
const aiChatModules = import.meta.glob<{ default: RouteComponent }>('./src/ai-chat/**/index.vue')
// 顶层独立演示页（glob 首段是字面段，`./src/ai-chat/**` 不匹配 `ai-orb`）
const aiOrbModules = import.meta.glob<{ default: RouteComponent }>('./src/ai-orb/index.vue')
const sheetModules = import.meta.glob<{ default: RouteComponent }>('./src/sheet/**/index.vue')
// 顶层独立演示页（glob 首段是字面段，`./src/sheet/**` 不匹配 `sheet-big-data` / `sheet-report`）
const sheetBigDataModules = import.meta.glob<{ default: RouteComponent }>(
  './src/sheet-big-data/index.vue'
)
const sheetReportModules = import.meta.glob<{ default: RouteComponent }>(
  './src/sheet-report/index.vue'
)
// 顶层独立演示页（同上，`./src/sheet/**` 不匹配 `sheet-data-entry`）
const sheetDataEntryModules = import.meta.glob<{ default: RouteComponent }>(
  './src/sheet-data-entry/index.vue'
)

const modules = {
  ...desktopModules,
  ...iconsModules,
  ...aiChatModules,
  ...aiOrbModules,
  ...sheetModules,
  ...sheetBigDataModules,
  ...sheetReportModules,
  ...sheetDataEntryModules
}
const paths = Object.keys(modules)

/** 从模块路径提取 demo key（用于 route name / demoMeta 校验） */
function demoKeyFromModulePath(path: string): string {
  const desktop = path.match(/src\/desktop\/([^/]+)\/index\.vue$/)
  if (desktop) return desktop[1]!

  const iconsNested = path.match(/src\/icons\/(.+)\/index\.vue$/)
  if (iconsNested) return `icons-${iconsNested[1]!.replace(/\//g, '-')}`

  const top = path.match(/src\/([^/]+)\/index\.vue$/)
  if (top) return top[1]!

  throw new Error(`[playground] 无法解析演示页 key: ${path}`)
}

if (import.meta.env.DEV) {
  for (const path of paths) {
    const key = demoKeyFromModulePath(path)
    // icons 子页（如 icons-combo）走 Icons 顶层菜单，不必进 demoMeta
    if (key.startsWith('icons-')) continue
    if (!(key in demoMeta)) {
      console.warn(`[playground] 演示页 "${key}" 未在 nav-config demoMeta 中配置`)
    }
  }
}

export const routes: RouteRecordRaw[] = paths.map((path) => {
  const name = demoKeyFromModulePath(path)

  return { name, component: modules[path]!, path: path.replace(/^\.\/src([\s\S]+)\.vue$/g, '$1') }
})

export const router: Router = createRouter({
  routes: [{ path: '/', redirect: DEFAULT_ROUTE }, ...routes],
  history: createWebHistory('/')
})
