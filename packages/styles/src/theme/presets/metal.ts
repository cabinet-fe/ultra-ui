import { darkTheme } from './dark'

/** 金属（枪铁底 + 熔钢橙 + 机加工锐角、金属倒角浮雕），天生适合深色 */
export const metalTheme = darkTheme.new({
  color: {
    primary: '#EE6C2B', // 熔钢橙
    success: '#389787', // 铜绿
    warning: '#B5991F', // 黄铜
    danger: '#E03131', // 铁锈红
    info: '#4F97C6', // 钛蓝
    disabled: '#2B2F35',
    default: '#2B2F35'
  },
  bg: {
    color: {
      bottom: '#14171B', // 枪铁
      middle: '#1B1F24',
      top: '#242930',
      hover: '#323A43'
    }
  },
  'text-color': {
    title: '#EEF2F5', // 铬白
    main: '#C8CFD6',
    second: '#98A1AA',
    placeholder: '#8A939C',
    assist: '#4C545C',
    disabled: '#59626B'
  },
  // mutedColor 与卡片底对比 ~2.6:1，输入控件带清晰的钢灰描边
  border: { color: '#3E454D', mutedColor: '#545D66' },
  // 机加工锐利边缘，小圆角
  radius: { small: 2, default: 4, large: 6 },
  shadow: {
    color: '#00000099',
    x: 0,
    y: 2,
    blur: 8,
    spread: 0,
    // 金属倒角：顶部 1px 冷高光 + 底部 1px 暗边，冲压钢板的立体感
    emboss:
      'inset 0 1px 0 0 rgba(255, 255, 255, 0.10), inset 0 -1px 0 0 rgba(0, 0, 0, 0.45), 0 1px 2px 0 rgba(0, 0, 0, 0.35)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.55)',
    lg: '0 12px 28px 0 rgba(0, 0, 0, 0.6), 0 4px 10px 0 rgba(0, 0, 0, 0.45)'
  },
  transition: {
    fast: '0.1s',
    normal: '0.16s',
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)'
  }
})
