
import type { App } from 'vue'
import * as components from './components'
import * as directives from './directives'

// 引入样式
import './styles'
import './components/auto-complete/style'
import './components/button/style'
import './components/action/style'
import './components/badge/style'
import './components/calendar/style'
import './components/batch-edit/style'
import './components/empty/style'
import './components/check-tag/style'
import './components/dropdown/style'
import './components/card/style'
import './components/file-picker/style'
import './components/checkbox-group/style'
import './components/checkbox/style'
import './components/dialog/style'
import './components/cascade/style'
import './components/context-menu/style'
import './components/expression-editor/style'
import './components/date-picker/style'
import './components/float-button/style'
import './components/form-item/style'
import './components/form/style'
import './components/grid/style'
import './components/grid-input/style'
import './components/gantt-chart/style'
import './components/icon/style'
import './components/group-input/style'
import './components/input/style'
import './components/loading/style'
import './components/list/style'
import './components/layout/style'
import './components/menu/style'
import './components/message/style'
import './components/multi-auto-complete/style'
import './components/multi-select/style'
import './components/message-confirm/style'
import './components/multi-tree-select/style'
import './components/node-render/style'
import './components/notification/style'
import './components/number/style'
import './components/number-input/style'
import './components/paginator/style'
import './components/palette/style'
import './components/password-input/style'
import './components/pop-confirm/style'
import './components/progress/style'
import './components/radio-group/style'
import './components/radio/style'
import './components/scroll/style'
import './components/select/style'
import './components/steps/style'
import './components/table/style'
import './components/tabs/style'
import './components/slider/style'
import './components/tag/style'
import './components/theme/style'
import './components/tip/style'
import './components/tree/style'
import './components/textarea/style'
import './components/text/style'
import './components/watermark/style'
import './components/tree-select/style'
import './directives/ripple/style'

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
