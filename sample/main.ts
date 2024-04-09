import {createApp, h} from "vue"
import App from "./App.vue"
import {router} from "./router"
import "ultra-ui/theme"
import loading from "@ui/components/loading/directive.js"
import "@ui/components/loading/style.scss"


const app = createApp({
  render: () => h(App),
})

app.config.globalProperties.c = console

app.directive("loading", loading)

app.use(router)

app.mount("#app")
