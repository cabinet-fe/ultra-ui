
import type { App } from 'vue'
import * as components from './components'
import * as directives from './directives'

// 引入样式
import './styles'
import './components/action/style.scss'
import './components/auto-complete/style.scss'
import './components/badge/style.scss'
import './components/button/style.scss'
import './components/dropdown/style.scss'
import './components/calendar/style.scss'
import './components/check-tag/style.scss'
import './components/context-menu/style.scss'
import './components/float-button/style.scss'
import './components/checkbox/style.scss'
import './components/dialog/style.scss'
import './components/checkbox-group/style.scss'
import './components/card/style.scss'
import './components/file-picker/style.scss'
import './components/empty/style.scss'
import './components/date-picker/style.scss'
import './components/color-picker/style.scss'
import './components/batch-edit/style.scss'
import './components/cascade/style.scss'
import './components/form/style.scss'
import './components/form-item/style.scss'
import './components/gantt-chart/style.scss'
import './components/grid/style.scss'
import './components/grid-input/style.scss'
import './components/group-input/style.scss'
import './components/icon/style.scss'
import './components/input/style.scss'
import './components/list/style.scss'
import './components/layout/style.scss'
import './components/loading/style.scss'
import './components/menu/style.scss'
import './components/message/style.scss'
import './components/message-confirm/style.scss'
import './components/multi-auto-complete/style.scss'
import './components/multi-select/style.scss'
import './components/multi-tree-select/style.scss'
import './components/node-render/style.scss'
import './components/notification/style.scss'
import './components/number/style.scss'
import './components/number-input/style.scss'
import './components/pop-confirm/style.scss'
import './components/password-input/style.scss'
import './components/progress/style.scss'
import './components/paginator/style.scss'
import './components/radio/style.scss'
import './components/radio-group/style.scss'
import './components/scroll/style.scss'
import './components/select/style.scss'
import './components/slider/style.scss'
import './components/steps/style.scss'
import './components/table/style.scss'
import './components/tabs/style.scss'
import './components/tag/style.scss'
import './components/text/style.scss'
import './components/text-editor/style.scss'
import './components/textarea/style.scss'
import './components/theme/style.scss'
import './components/tip/style.scss'
import './components/tree/style.scss'
import './components/tree-select/style.scss'
import './components/watermark/style.scss'
import './directives/ripple/style.scss'

export function UltraUI(app: App) {
  Object.keys(components).forEach(key => {
    if (key.startsWith('U')) {
      const component = components[key]
      component && app.component(key, component)
    }
  })

  Object.keys(directives).forEach(key => {
    if (key.startsWith('v')) {
      const directive = directives[key]
      directive && app.directive(key.slice(1), directive)
    }
  })
}
