import { createApp, h } from 'vue'
import App from './App.vue'
import { router } from './router'
import { UltraUI } from '../ui/install'

const app = createApp({
  render: () => h(App)
})

app.config.globalProperties.c = console

app.use(UltraUI)

app.use(router)

app.mount('#app')
