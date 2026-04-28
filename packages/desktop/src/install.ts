import { vClickOutside, vFocus, vRipple } from '@veltra/directives'
import type { App, Component, Plugin } from 'vue'

import * as components from './components'
import { vLoading } from './components/loading'
import './style'

function isComponentExport(name: string, value: unknown): value is Component {
  return name.startsWith('U') && (typeof value === 'object' || typeof value === 'function')
}

export function install(app: App): void {
  for (const [name, component] of Object.entries(components)) {
    if (isComponentExport(name, component)) {
      app.component(name, component)
    }
  }

  app.directive('ripple', vRipple)
  app.directive('click-outside', vClickOutside)
  app.directive('focus', vFocus)
  app.directive('loading', vLoading)
}

export const UltraUI: Plugin = { install }

export default UltraUI
