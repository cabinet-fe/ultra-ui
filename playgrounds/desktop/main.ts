import { createApp, h } from 'vue'

import App from './App.vue'
import { router } from './router'

import '@veltra/styles/normalize'
import '@veltra/desktop/components/message/style.js'
import '@veltra/desktop/components/message-confirm/style.js'
import '@veltra/desktop/components/notification/style.js'

const app = createApp({ render: () => h(App) })

app.use(router)

app.mount('#app')
