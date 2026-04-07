import { createApp, h } from 'vue'
import App from './App.vue'
import { router } from './router'
import { vLoading } from '@ultra-ui/pc'
import '@ultra-ui/styles'
import '@ultra-ui/pc/components/loading/style'
import 'virtual:uno.css'

const app = createApp({
  render: () => h(App)
})

app.use(router)
app.directive('loading', vLoading)

app.mount('#app')
