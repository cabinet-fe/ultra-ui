import type { Plugin } from 'vue'
import * as components from './components'

export const UltraUIComponent: Plugin = function (app) {
  Object.keys(components)
    .filter(key => key.startsWith('U'))
    .forEach(key => {
      const component = components[key]
      app.component(key, component)
    })
}
