import { createApp, h } from 'vue'
import App from './App.vue'
import { router } from './router'

import 'ultra-ui/styles'

const app = createApp({
  render: () => h(App)
})

// app.use(UltraUI)

app.use(router)

app.mount('#app')
