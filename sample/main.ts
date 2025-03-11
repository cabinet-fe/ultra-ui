import { createApp, h } from 'vue'
import App from './App.vue'
import { router } from './router'
// import { UltraUI } from '../ui/install'
import { lightTheme, loadTheme, UITheme } from '../ui/styles/theme'
import 'ultra-ui/styles'

loadTheme(
  lightTheme.new({
    menu: {
      bg: {
        color: '#1172C3'
      },
      color: '#fff'
    }
  })
)

const app = createApp({
  render: () => h(App)
})

// app.use(UltraUI)

app.use(router)

app.mount('#app')
