// USheet UI 实际渲染的 desktop 组件样式（#15：缺项会导致仅依赖本入口的宿主拿到无样式组件）
import '@veltra/desktop/components/contextmenu/style'
import '@veltra/desktop/components/dropdown/style'
import '@veltra/desktop/components/number-input/style'
import '@veltra/desktop/components/palette/style'
import '@veltra/desktop/components/scroll/style'
import '@veltra/desktop/components/tip/style'
import '@veltra/desktop/components/loading/style' // v-loading（sheet.vue grid 容器）
import '@veltra/desktop/components/message/style' // message / messageConfirm（弹层、tabs、公式栏）
import '@veltra/desktop/components/input/style' // UInput（find-popup）
import '@veltra/desktop/components/file-picker/style' // UFilePicker（insert-image-popup）
import '@veltra/desktop/components/icon/style' // UIcon（sheet-toolbar / sheet-tabs）
import './style.scss'
