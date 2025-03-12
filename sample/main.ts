import { createApp, h } from 'vue'
import App from './App.vue'
import { router } from './router'
// import { UltraUI } from '../ui/install'
import { lightTheme, loadTheme } from '../ui/styles/theme'
import 'ultra-ui/styles'

loadTheme()
// lightTheme.new({
//   menu: {
//     bg: {
//       color: '#1172C3'
//     },
//     hover: {
//       bg: '#f00'
//     },
//     active: {
//       bg: '#0f0'
//     },
//     color: '#fff'
//   },
//   table: {
//     stripe: {
//       bg: '#f00',
//       color: '#fff'
//     },
//     hover: {
//       bg: '#0f0',
//       color: '#fff'
//     }
//   }
// })

const app = createApp({
  render: () => h(App)
})

// app.use(UltraUI)

app.use(router)

app.mount('#app')
