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
const sheetModules = import.meta.glob<{ default: RouteComponent }>('./src/sheet/**/index.vue')

const modules = { ...desktopModules, ...iconsModules, ...aiChatModules, ...sheetModules }
const paths = Object.keys(modules)

const DEMO_KEY_RE = /src\/(?:desktop\/)?([^/]+)\/index\.vue$/

if (import.meta.env.DEV) {
  for (const path of paths) {
    const key = path.match(DEMO_KEY_RE)![1]!
    if (!(key in demoMeta)) {
      console.warn(`[playground] 演示页 "${key}" 未在 nav-config demoMeta 中配置`)
    }
  }
}

export const routes: RouteRecordRaw[] = paths.map((path) => {
  const name = path.match(DEMO_KEY_RE)![1]!

  return { name, component: modules[path]!, path: path.replace(/^\.\/src([\s\S]+)\.vue$/g, '$1') }
})

export const router: Router = createRouter({
  routes: [{ path: '/', redirect: DEFAULT_ROUTE }, ...routes],
  history: createWebHistory('/')
})
