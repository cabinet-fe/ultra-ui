import { createApp, h } from 'vue'
import App from './App.vue'
import { router } from './router'
import 'ultra-ui/styles/theme.scss'
import 'ultra-ui/styles'
import loading from 'ultra-ui/components/loading/directive'
import 'ultra-ui/components/loading/style.scss'

const app = createApp({
  render: () => h(App)
})

app.config.globalProperties.c = console

app.directive('loading', loading)

app.use(router)

app.mount('#app')
