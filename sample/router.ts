import {
  createRouter,
  createWebHistory,
  type RouteComponent,
  type Router,
  type RouteRecordRaw
} from 'vue-router'

const modules = import.meta.glob<{ default: RouteComponent }>(
  './src/**/index.vue'
)

const paths = Object.keys(modules)

export const routes: RouteRecordRaw[] = paths.map(path => {
  const name = path.match(/src\/([A-z-]+)\/index.vue/)![1]!

  return {
    name,
    component: modules[path]!,
    path: path.replace(/^\.\/src([\s\S]+)\.vue$/g, '$1')
  }
})

export const router: Router = createRouter({
  routes: [
    ...(routes[0]
      ? [
          {
            path: '/',
            redirect: routes[0]!.path
          }
        ]
      : []),
    ...routes
  ],
  history: createWebHistory('/')
})
