import { createRouter, createWebHistory, RouteComponent } from 'vue-router'

// const modules = import.meta.glob<true, string, { default: RouteComponent }>(
//   '../ui-packages/components/**/example/index.vue',
//   { eager: true }
// )
const modules = import.meta.glob<true, string, { default: RouteComponent }>(
  './src/**/index.vue',
  { eager: true }
)

const paths = Object.keys(modules)

// export const routes = paths.map(path => {
//   return {
//     name: path.match(/components\/([A-z-]+)\/example/)![1]!,
//     component: modules[path]!.default,
//     path: path.replace(/^\.*\/ui-packages\/[A-z]+([\s\S]+)\.vue$/g, '$1')
//   }
// })

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
