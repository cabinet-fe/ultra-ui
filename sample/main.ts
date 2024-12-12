import { createApp, h } from 'vue'
import App from './App.vue'
import { router } from './router'
// import { UltraUI } from '../ui/install'
import { loadTheme } from '../ui/styles/theme'
import 'ultra-ui/styles'

loadTheme()

const app = createApp({
  render: () => h(App)
})

// app.use(UltraUI)

app.use(router)

app.mount('#app')
