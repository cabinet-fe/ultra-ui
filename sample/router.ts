import { createRouter, createWebHistory, RouteComponent } from 'vue-router'

const modules = import.meta.glob<true, string, { default: RouteComponent }>(
  '../**/example/index.vue',
  { eager: true }
)

const paths = Object.keys(modules)

export const routes = paths.map(path => {
  return {
    name: path.match(/ui\/[A-z-]+\/([A-z]+)\/example/)![1]!,
    component: modules[path]!.default,
    path: path.replace(/^\.*/g, '').replace(/\.vue$/, '')
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
