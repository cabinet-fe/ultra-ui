import { createRouter, createWebHistory, type RouteComponent } from 'vue-router'

const modules = import.meta.glob<true, string, { default: RouteComponent }>(
  './src/**/index.vue',
  { eager: true }
)

const paths = Object.keys(modules)

export const routes = paths.map(path => {
  return {
    name: path.match(/src\/([A-z-]+)\/index.vue/)![1]!,
    component: modules[path]!.default,
    path: path.replace(/^\.\/src([\s\S]+)\.vue$/g, '$1')
  }
})

export const router = createRouter({
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

router.beforeEach((to, from, next) => {
  next()
})
