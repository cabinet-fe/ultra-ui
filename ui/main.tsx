import { createApp } from 'vue'
import { UButton } from './index'
import { light } from '@ui/theme'

document.documentElement.className = light

const app = createApp({
  setup() {
    return () => <UButton>111</UButton>
  }
})

app.mount('#app')
